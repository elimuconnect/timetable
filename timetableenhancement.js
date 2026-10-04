/* ============================================================
   TIMETABLE ENHANCEMENT ENGINE
   ============================================================

   IMPORTANT:
   - This file is completely separate from timetableparallelmaster.js.
   - It NEVER modifies timetable_entries.
   - It loads the generated timetable and creates an enhanced copy.
   - Enhanced data is saved to timetable_enhanced_entries.

   Main rules:
      1. PPI before morning break
      2. Mathematics in morning
      3. Optional spreading of repeated subjects
      4. Optional avoidance of late core subjects

   Preserved constraints:
      - Stream conflicts
      - Teacher conflicts
      - Room conflicts
      - Required doubles
      - Parallel groups
      - Weekly lesson counts
   ============================================================ */

(function () {

    "use strict";

    console.log("🛠️ Timetable Enhancement Engine loading...");


    /* ========================================================
       GLOBAL STATE
       ======================================================== */

    const enhancementState = {

        schoolId: null,

        sourceEntries: [],

        enhancedEntries: [],

        periods: [],
        streams: [],
        subjects: [],
        teachers: [],
        rooms: [],
        requirements: [],

        periodMap: new Map(),
        streamMap: new Map(),
        subjectMap: new Map(),
        teacherMap: new Map(),
        roomMap: new Map(),
        requirementMap: new Map(),

        subjectRequirements: new Map(),

        originalViolations: [],
        remainingViolations: [],
        changes: [],

        enhancementGenerationId: null,

        loaded: false,
        enhanced: false,
        saved: false,

        initialized: false
    };


    /* ========================================================
       CONSTANTS
       ======================================================== */

    const PAGE_SIZE = 1000;

    const MORNING_END_HOUR = 13;

    const PPI_NAMES = [
        "ppi",
        "p.p.i",
        "p p i",
        "personal project",
        "personal project initiative",
        "personal projects",
        "personal project work"
    ];

    const MATH_NAMES = [
        "mathematics",
        "math",
        "maths"
    ];



    /* ========================================================
       UTILITY FUNCTIONS
       ======================================================== */

    function getSupabase() {

        if (typeof supabaseClient !== "undefined") {
            return supabaseClient;
        }

        if (typeof window.supabaseClient !== "undefined") {
            return window.supabaseClient;
        }

        throw new Error(
            "Supabase client was not found. Make sure app.js loads before timetableenhancement.js."
        );
    }


    function normalizeText(value) {

        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ")
            .replace(/[._-]+/g, " ");
    }


    function cleanSubjectName(value) {

        return normalizeText(value)
            .replace(/\([^)]*\)/g, "")
            .trim();
    }


    function isPPI(subject) {

        if (!subject) return false;

        const name = cleanSubjectName(subject.subject_name);
        const code = normalizeText(subject.subject_code);

        if (code === "ppi") return true;

        return PPI_NAMES.some(nameValue =>
            name === nameValue ||
            name.includes(nameValue)
        );
    }


    function isMathematics(subject) {

        if (!subject) return false;

        const name = cleanSubjectName(subject.subject_name);
        const code = normalizeText(subject.subject_code);

        if (
            code === "math" ||
            code === "maths" ||
            code === "mat"
        ) {
            return true;
        }

        return MATH_NAMES.some(nameValue =>
            name === nameValue
        );
    }


    function getPeriodKey(periodId) {

        return String(periodId);
    }


    function getStreamKey(streamId) {

        return String(streamId);
    }


    function getTeacherKey(teacherId) {

        return String(teacherId || "");
    }


    function getRoomKey(roomId) {

        return String(roomId || "");
    }


    function getSubjectKey(subjectId) {

        return String(subjectId);
    }


    function periodIsTeaching(period) {

        if (!period) return false;

        return period.is_teaching_period !== false;
    }


    function periodOrder(period) {

        if (!period) return 999999;

        return Number(
            period.period_order ??
            period.period_number ??
            999999
        );
    }


    function periodNumber(period) {

        if (!period) return null;

        return Number(
            period.period_number ??
            period.period_order ??
            0
        );
    }


    function dayNumber(period) {

        if (!period) return null;

        return Number(period.day_number || 0);
    }


    function periodLabel(period) {

        if (!period) return "";

        return (
            period.period_name ||
            `Period ${period.period_number || ""}`
        );
    }


    function timeToMinutes(value) {

        if (!value) return null;

        const text = String(value).trim();

        const match = text.match(
            /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i
        );

        if (!match) return null;

        let hour = Number(match[1]);
        const minute = Number(match[2] || 0);
        const ampm = String(match[3] || "").toUpperCase();

        if (ampm === "PM" && hour < 12) {
            hour += 12;
        }

        if (ampm === "AM" && hour === 12) {
            hour = 0;
        }

        return hour * 60 + minute;
    }


    function getStartMinutes(period) {

        if (!period) return null;

        return timeToMinutes(period.start_time);
    }


    function getEndMinutes(period) {

        if (!period) return null;

        return timeToMinutes(period.end_time);
    }


    function isAfternoonPeriod(period) {

        const start = getStartMinutes(period);

        if (start !== null) {
            return start >= MORNING_END_HOUR * 60;
        }

        const order = periodOrder(period);

        const teachingPeriods = enhancementState.periods
            .filter(periodIsTeaching)
            .sort((a, b) => periodOrder(a) - periodOrder(b));

        if (!teachingPeriods.length) {
            return false;
        }

        const middle = Math.ceil(teachingPeriods.length / 2);

        const index = teachingPeriods.findIndex(
            p => p.id === period.id
        );

        return index >= middle;
    }


    function isBeforeBreak(period) {

        const breakInfo = findMorningBreak();

        if (!breakInfo || !period) {
            return false;
        }

        return periodOrder(period) < periodOrder(breakInfo);
    }


    function isAfterBreak(period) {

        const breakInfo = findMorningBreak();

        if (!breakInfo || !period) {
            return false;
        }

        return periodOrder(period) > periodOrder(breakInfo);
    }


    /* ========================================================
       STATUS UI
       ======================================================== */

    function setLoadStatus(message, type = "info") {

        const element =
            document.getElementById("enhancementLoadStatus");

        if (!element) return;

        element.style.display = "block";

        element.textContent = message;

        element.dataset.type = type;
    }


    function setSaveStatus(message, type = "info") {

        const element =
            document.getElementById("enhancementSaveStatus");

        if (!element) return;

        element.style.display = "block";

        element.textContent = message;

        element.dataset.type = type;
    }


    function showElement(id) {

        const element = document.getElementById(id);

        if (element) {
            element.style.display = "";
        }
    }


    function hideElement(id) {

        const element = document.getElementById(id);

        if (element) {
            element.style.display = "none";
        }
    }


    /* ========================================================
       LOAD DATA
       ======================================================== */

    async function loadAllRows(tableName, schoolId) {

        const supabase = getSupabase();

        let rows = [];
        let from = 0;

        while (true) {

            const { data, error } = await supabase
                .from(tableName)
                .select("*")
                .eq("school_id", schoolId)
                .order("created_at", {
                    ascending: true
                })
                .order("id", {
                    ascending: true
                })
                .range(
                    from,
                    from + PAGE_SIZE - 1
                );

            if (error) {
                throw new Error(
                    `Failed loading ${tableName}: ${error.message}`
                );
            }

            const page = data || [];

            rows.push(...page);

            console.log(
                `🛠️ ${tableName}: loaded ${from + 1}-${from + page.length}`
            );

            if (page.length < PAGE_SIZE) {
                break;
            }

            from += PAGE_SIZE;
        }

        console.log(
            `🛠️ ${tableName}: TOTAL ${rows.length}`
        );

        return rows;
    }


    async function loadGeneratedEntries() {

        const supabase = getSupabase();

        let entries = [];
        let from = 0;

        while (true) {

            const { data, error } = await supabase
                .from("timetable_entries")
                .select("*")
                .eq(
                    "school_id",
                    enhancementState.schoolId
                )
                .order("created_at", {
                    ascending: true
                })
                .order("id", {
                    ascending: true
                })
                .range(
                    from,
                    from + PAGE_SIZE - 1
                );

            if (error) {

                throw new Error(
                    `Failed loading timetable_entries: ${error.message}`
                );
            }

            const page = data || [];

            entries.push(...page);

            console.log(
                `🛠️ timetable_entries ${from + 1}-${from + page.length}`
            );

            if (page.length < PAGE_SIZE) {
                break;
            }

            from += PAGE_SIZE;
        }

        console.log(
            `🛠️ TOTAL GENERATED ENTRIES: ${entries.length}`
        );

        return entries;
    }


    async function loadEnhancementData() {

        if (!enhancementState.schoolId) {

            throw new Error(
                "School ID is missing."
            );
        }

        setLoadStatus(
            "⏳ Loading generated timetable...",
            "loading"
        );

        const [
            entries,
            periods,
            streams,
            subjects,
            teachers,
            rooms,
            requirements
        ] = await Promise.all([

            loadGeneratedEntries(),

            loadAllRows(
                "timetable_periods",
                enhancementState.schoolId
            ),

            loadAllRows(
                "timetable_streams",
                enhancementState.schoolId
            ),

            loadAllRows(
                "timetable_subjects",
                enhancementState.schoolId
            ),

            loadAllRows(
                "timetable_teachers",
                enhancementState.schoolId
            ),

            loadAllRows(
                "timetable_rooms",
                enhancementState.schoolId
            ),

            loadAllRows(
                "timetable_requirements",
                enhancementState.schoolId
            )
        ]);


        enhancementState.sourceEntries = entries.map(
            entry => ({
                ...entry
            })
        );

        enhancementState.enhancedEntries = entries.map(
            entry => ({
                ...entry
            })
        );

        enhancementState.periods = periods;
        enhancementState.streams = streams;
        enhancementState.subjects = subjects;
        enhancementState.teachers = teachers;
        enhancementState.rooms = rooms;
        enhancementState.requirements = requirements;


        buildLookups();

        enhancementState.loaded = true;

        console.log(
            "🛠️ ENHANCEMENT DATA LOADED",
            {
                entries: entries.length,
                periods: periods.length,
                streams: streams.length,
                subjects: subjects.length,
                teachers: teachers.length,
                rooms: rooms.length,
                requirements: requirements.length
            }
        );


        setLoadStatus(
            `✅ Loaded ${entries.length} timetable entries successfully.`,
            "success"
        );

        showElement("enhancementRulesCard");

        return enhancementState;
    }



    /* ========================================================
       LOOKUPS
       ======================================================== */

    function buildLookups() {

        enhancementState.periodMap = new Map(
            enhancementState.periods.map(
                row => [String(row.id), row]
            )
        );

        enhancementState.streamMap = new Map(
            enhancementState.streams.map(
                row => [String(row.id), row]
            )
        );

        enhancementState.subjectMap = new Map(
            enhancementState.subjects.map(
                row => [String(row.id), row]
            )
        );

        enhancementState.teacherMap = new Map(
            enhancementState.teachers.map(
                row => [String(row.id), row]
            )
        );

        enhancementState.roomMap = new Map(
            enhancementState.rooms.map(
                row => [String(row.id), row]
            )
        );

        enhancementState.requirementMap = new Map(
            enhancementState.requirements.map(
                row => [String(row.id), row]
            )
        );


        enhancementState.subjectRequirements =
            new Map();


        for (
            const requirement
            of enhancementState.requirements
        ) {

            const key =
                `${requirement.stream_id}__${requirement.subject_id}`;

            enhancementState.subjectRequirements.set(
                key,
                requirement
            );
        }
    }


    function getPeriod(periodId) {

        return enhancementState.periodMap.get(
            String(periodId)
        );
    }


    function getStream(streamId) {

        return enhancementState.streamMap.get(
            String(streamId)
        );
    }


    function getSubject(subjectId) {

        return enhancementState.subjectMap.get(
            String(subjectId)
        );
    }


    function getTeacher(teacherId) {

        if (!teacherId) return null;

        return enhancementState.teacherMap.get(
            String(teacherId)
        );
    }


    function getRoom(roomId) {

        if (!roomId) return null;

        return enhancementState.roomMap.get(
            String(roomId)
        );
    }


    function getRequirement(entry) {

        const key =
            `${entry.stream_id}__${entry.subject_id}`;

        return enhancementState.subjectRequirements.get(key)
            || null;
    }



    /* ========================================================
       MORNING BREAK DETECTION
       ======================================================== */

    function isBreakPeriod(period) {

        if (!period) return false;

        if (period.is_teaching_period === false) {
            return true;
        }

        const text = normalizeText(
            `${period.period_name || ""} ${period.period_type || ""}`
        );

        return (
            text.includes("break") ||
            text.includes("tea") ||
            text.includes("recess")
        );
    }


    function findMorningBreak() {

        const candidates =
            enhancementState.periods
                .filter(isBreakPeriod)
                .sort(
                    (a, b) =>
                        periodOrder(a) -
                        periodOrder(b)
                );

        if (!candidates.length) {

            console.warn(
                "⚠️ No explicit break period found."
            );

            return null;
        }

        /*
         * The first break occurring during the school day
         * is treated as the morning break.
         */

        const first = candidates[0];

        console.log(
            "☕ Morning break detected:",
            {
                id: first.id,
                day: first.day_name,
                period: first.period_name,
                start: first.start_time,
                end: first.end_time
            }
        );

        return first;
    }



    /* ========================================================
       ENTRY DESCRIPTION
       ======================================================== */

    function describeEntry(entry) {

        const subject = getSubject(entry.subject_id);
        const stream = getStream(entry.stream_id);
        const teacher = getTeacher(entry.teacher_id);
        const period = getPeriod(entry.period_id);

        return {

            entry,

            subject,
            stream,
            teacher,
            period,

            subjectName:
                subject?.subject_name ||
                "Unknown Subject",

            subjectCode:
                subject?.subject_code ||
                "",

            streamName:
                stream?.stream_name ||
                "Unknown Stream",

            teacherName:
                teacher?.full_name ||
                teacher?.name ||
                "Unassigned",

            day:
                period?.day_name ||
                "",

            periodName:
                period?.period_name ||
                "",

            startTime:
                period?.start_time ||
                "",

            endTime:
                period?.end_time ||
                ""
        };
    }



    /* ========================================================
       VIOLATION OBJECT
       ======================================================== */

    function createViolation(
        type,
        entry,
        message,
        severity = "high"
    ) {

        const description =
            describeEntry(entry);

        return {

            id:
                `${type}_${entry.id}`,

            type,

            severity,

            entryId:
                entry.id,

            streamId:
                entry.stream_id,

            subjectId:
                entry.subject_id,

            teacherId:
                entry.teacher_id,

            periodId:
                entry.period_id,

            message,

            ...description
        };
    }



    /* ========================================================
       RULE CHECKING
       ======================================================== */

    function checkPPIBeforeBreak(entries) {

        const violations = [];

        const breakPeriod =
            findMorningBreak();

        if (!breakPeriod) {
            return violations;
        }

        for (const entry of entries) {

            const subject =
                getSubject(entry.subject_id);

            if (!isPPI(subject)) {
                continue;
            }

            const period =
                getPeriod(entry.period_id);

            if (!period) {
                continue;
            }

            /*
             * PPI is required before the morning break.
             */

            if (!isBeforeBreak(period)) {

                const d =
                    describeEntry(entry);

                violations.push(
                    createViolation(
                        "PPI_AFTER_BREAK",
                        entry,
                        `PPI for ${d.streamName} is scheduled ${d.day} ${d.periodName} (${d.startTime}-${d.endTime}), which is not before the morning break.`,
                        "high"
                    )
                );
            }
        }

        return violations;
    }


    function checkMathsMorning(entries) {

        const violations = [];

        for (const entry of entries) {

            const subject =
                getSubject(entry.subject_id);

            if (!isMathematics(subject)) {
                continue;
            }

            const period =
                getPeriod(entry.period_id);

            if (!period) {
                continue;
            }

            if (isAfternoonPeriod(period)) {

                const d =
                    describeEntry(entry);

                violations.push(
                    createViolation(
                        "MATHS_AFTERNOON",
                        entry,
                        `Mathematics for ${d.streamName} is scheduled ${d.day} ${d.periodName} (${d.startTime}-${d.endTime}), which is in the afternoon.`,
                        "high"
                    )
                );
            }
        }

        return violations;
    }


    function checkSpreadSubjects(entries) {

        const violations = [];

        const byStreamSubject =
            new Map();


        for (const entry of entries) {

            const key =
                `${entry.stream_id}__${entry.subject_id}`;

            if (!byStreamSubject.has(key)) {
                byStreamSubject.set(
                    key,
                    []
                );
            }

            byStreamSubject
                .get(key)
                .push(entry);
        }


        for (
            const [
                key,
                subjectEntries
            ]
            of byStreamSubject
        ) {

            if (subjectEntries.length < 2) {
                continue;
            }

            subjectEntries.sort(
                (a, b) => {

                    const pa =
                        getPeriod(a.period_id);

                    const pb =
                        getPeriod(b.period_id);

                    if (
                        dayNumber(pa) !==
                        dayNumber(pb)
                    ) {
                        return (
                            dayNumber(pa) -
                            dayNumber(pb)
                        );
                    }

                    return (
                        periodOrder(pa) -
                        periodOrder(pb)
                    );
                }
            );


            for (
                let i = 1;
                i < subjectEntries.length;
                i++
            ) {

                const previous =
                    subjectEntries[i - 1];

                const current =
                    subjectEntries[i];

                const previousPeriod =
                    getPeriod(
                        previous.period_id
                    );

                const currentPeriod =
                    getPeriod(
                        current.period_id
                    );

                if (
                    !previousPeriod ||
                    !currentPeriod
                ) {
                    continue;
                }

                const sameDay =
                    dayNumber(previousPeriod) ===
                    dayNumber(currentPeriod);

                const close =
                    Math.abs(
                        periodOrder(currentPeriod) -
                        periodOrder(previousPeriod)
                    ) <= 1;

                if (sameDay && close) {

                    const d =
                        describeEntry(current);

                    violations.push(
                        createViolation(
                            "SUBJECT_TOO_CLOSE",
                            current,
                            `${d.subjectName} is repeated too closely for ${d.streamName} on ${d.day}.`,
                            "medium"
                        )
                    );
                }
            }
        }

        return violations;
    }


    function checkAllRules(entries) {

        const violations = [];

        if (
            document.getElementById(
                "rulePpiBeforeBreak"
            )?.checked
        ) {

            violations.push(
                ...checkPPIBeforeBreak(entries)
            );
        }


        if (
            document.getElementById(
                "ruleNoMathsAfternoon"
            )?.checked
        ) {

            violations.push(
                ...checkMathsMorning(entries)
            );
        }


        if (
            document.getElementById(
                "ruleSpreadSubjectAcrossWeek"
            )?.checked
        ) {

            violations.push(
                ...checkSpreadSubjects(entries)
            );
        }


        return violations;
    }



    /* ========================================================
       DOUBLE LESSON SUPPORT
       ======================================================== */

    function getDoubleGroup(entry, entries) {

        const requirement =
            getRequirement(entry);

        if (
            !requirement ||
            Number(
                requirement.double_lessons_per_week || 0
            ) <= 0
        ) {
            return [entry];
        }


        const period =
            getPeriod(entry.period_id);

        if (!period) {
            return [entry];
        }


        const sameStreamSubject =
            entries.filter(
                candidate =>
                    candidate.stream_id ===
                        entry.stream_id &&

                    candidate.subject_id ===
                        entry.subject_id
            );


        const dayEntries =
            sameStreamSubject.filter(
                candidate => {

                    const candidatePeriod =
                        getPeriod(
                            candidate.period_id
                        );

                    return (
                        candidatePeriod &&
                        dayNumber(candidatePeriod) ===
                            dayNumber(period)
                    );
                }
            );


        const sorted =
            dayEntries.sort(
                (a, b) =>
                    periodOrder(
                        getPeriod(a.period_id)
                    ) -
                    periodOrder(
                        getPeriod(b.period_id)
                    )
            );


        const index =
            sorted.findIndex(
                candidate =>
                    candidate.id ===
                    entry.id
            );


        if (index < 0) {
            return [entry];
        }


        const group = [entry];


        if (index > 0) {

            const previous =
                sorted[index - 1];

            if (
                periodOrder(
                    getPeriod(previous.period_id)
                ) ===
                periodOrder(period) - 1
            ) {
                group.unshift(previous);
            }
        }


        if (index < sorted.length - 1) {

            const next =
                sorted[index + 1];

            if (
                periodOrder(
                    getPeriod(next.period_id)
                ) ===
                periodOrder(period) + 1
            ) {
                group.push(next);
            }
        }


        return group;
    }



    /* ========================================================
       PARALLEL GROUP SUPPORT
       ======================================================== */

    function getParallelGroup(entry) {

        const requirement =
            getRequirement(entry);

        if (!requirement) {
            return null;
        }

        const group =
            requirement.parallel_group;

        if (!group) {
            return null;
        }

        return String(group)
            .trim()
            .toLowerCase();
    }


    function getParallelEntries(
        entry,
        entries
    ) {

        const group =
            getParallelGroup(entry);

        if (!group) {
            return [entry];
        }


        return entries.filter(
            candidate => {

                if (
                    getParallelGroup(candidate) !==
                    group
                ) {
                    return false;
                }

                const candidatePeriod =
                    getPeriod(
                        candidate.period_id
                    );

                const entryPeriod =
                    getPeriod(
                        entry.period_id
                    );

                if (
                    !candidatePeriod ||
                    !entryPeriod
                ) {
                    return false;
                }

                return (
                    dayNumber(candidatePeriod) ===
                    dayNumber(entryPeriod) &&

                    periodOrder(candidatePeriod) ===
                    periodOrder(entryPeriod)
                );
            }
        );
    }



    /* ========================================================
       OCCUPANCY MAPS
       ======================================================== */

    function buildOccupancy(entries) {

        const streamMap = new Map();
        const teacherMap = new Map();
        const roomMap = new Map();


        for (const entry of entries) {

            const period =
                getPeriod(entry.period_id);

            if (!period) continue;


            const periodKey =
                String(entry.period_id);


            const streamKey =
                `${entry.stream_id}__${periodKey}`;


            if (!streamMap.has(streamKey)) {
                streamMap.set(
                    streamKey,
                    []
                );
            }

            streamMap
                .get(streamKey)
                .push(entry);


            if (entry.teacher_id) {

                const teacherKey =
                    `${entry.teacher_id}__${periodKey}`;

                if (!teacherMap.has(teacherKey)) {

                    teacherMap.set(
                        teacherKey,
                        []
                    );
                }

                teacherMap
                    .get(teacherKey)
                    .push(entry);
            }


            if (entry.room_id) {

                const roomKey =
                    `${entry.room_id}__${periodKey}`;

                if (!roomMap.has(roomKey)) {

                    roomMap.set(
                        roomKey,
                        []
                    );
                }

                roomMap
                    .get(roomKey)
                    .push(entry);
            }
        }


        return {
            streamMap,
            teacherMap,
            roomMap
        };
    }



    /* ========================================================
       ROOM VALIDATION
       ======================================================== */

    function roomIsSuitable(
        entry,
        targetPeriod,
        entries
    ) {

        if (!entry.room_id) {
            return true;
        }

        const room =
            getRoom(entry.room_id);

        if (!room) {
            return true;
        }


        const requirement =
            getRequirement(entry);

        if (!requirement) {
            return true;
        }


        const requiredType =
            requirement.room_type ||
            null;

        const requiredTypeId =
            requirement.room_type_id ||
            null;


        if (
            requiredType &&
            room.room_type &&
            normalizeText(
                requiredType
            ) !==
            normalizeText(
                room.room_type
            )
        ) {

            return false;
        }


        if (
            requiredTypeId &&
            room.room_type_id &&
            String(requiredTypeId) !==
            String(room.room_type_id)
        ) {

            return false;
        }


        return true;
    }



    /* ========================================================
       TARGET PERIOD VALIDATION
       ======================================================== */

    function canPlaceEntry(
        entry,
        targetPeriod,
        entries,
        options = {}
    ) {

        if (!entry || !targetPeriod) {
            return false;
        }


        if (!periodIsTeaching(targetPeriod)) {
            return false;
        }


        const targetPeriodId =
            String(targetPeriod.id);


        /*
         * Stream conflict
         */

        if (
            options.preserveStream !== false
        ) {

            const streamConflict =
                entries.some(
                    candidate => {

                        if (
                            candidate.id ===
                            entry.id
                        ) {
                            return false;
                        }

                        return (
                            String(
                                candidate.stream_id
                            ) ===
                            String(
                                entry.stream_id
                            ) &&

                            String(
                                candidate.period_id
                            ) ===
                            targetPeriodId
                        );
                    }
                );

            if (streamConflict) {
                return false;
            }
        }


        /*
         * Teacher conflict
         */

        if (
            entry.teacher_id &&
            options.preserveTeacher !== false
        ) {

            const teacherConflict =
                entries.some(
                    candidate => {

                        if (
                            candidate.id ===
                            entry.id
                        ) {
                            return false;
                        }

                        if (
                            !candidate.teacher_id
                        ) {
                            return false;
                        }

                        return (
                            String(
                                candidate.teacher_id
                            ) ===
                            String(
                                entry.teacher_id
                            ) &&

                            String(
                                candidate.period_id
                            ) ===
                            targetPeriodId
                        );
                    }
                );

            if (teacherConflict) {
                return false;
            }
        }


        /*
         * Room conflict
         */

        if (
            entry.room_id &&
            options.preserveRoom !== false
        ) {

            const roomConflict =
                entries.some(
                    candidate => {

                        if (
                            candidate.id ===
                            entry.id
                        ) {
                            return false;
                        }

                        if (
                            !candidate.room_id
                        ) {
                            return false;
                        }

                        return (
                            String(
                                candidate.room_id
                            ) ===
                            String(
                                entry.room_id
                            ) &&

                            String(
                                candidate.period_id
                            ) ===
                            targetPeriodId
                        );
                    }
                );

            if (roomConflict) {
                return false;
            }
        }


        /*
         * Room suitability
         */

        if (
            options.preserveRoom !== false &&
            !roomIsSuitable(
                entry,
                targetPeriod,
                entries
            )
        ) {
            return false;
        }


        return true;
    }



    /* ========================================================
       WEEKLY COUNT SAFETY
       ======================================================== */

    function getWeeklyCount(
        entry,
        entries
    ) {

        return entries.filter(
            candidate =>

                String(
                    candidate.stream_id
                ) ===
                String(
                    entry.stream_id
                ) &&

                String(
                    candidate.subject_id
                ) ===
                String(
                    entry.subject_id
                )
        ).length;
    }


    function weeklyCountWouldRemainValid(
        entry,
        entries
    ) {

        /*
         * A move does not change the number of lessons.
         * This function is kept explicitly so future
         * enhancement rules cannot accidentally create
         * or remove lessons.
         */

        const before =
            getWeeklyCount(
                entry,
                entries
            );

        return before >= 1;
    }



    /* ========================================================
       SPECIAL RULE VALIDATION
       ======================================================== */

    function targetSatisfiesSpecialRule(
        entry,
        targetPeriod
    ) {

        const subject =
            getSubject(entry.subject_id);


        /*
         * PPI before break
         */

        if (
            isPPI(subject) &&
            document.getElementById(
                "rulePpiBeforeBreak"
            )?.checked
        ) {

            if (!isBeforeBreak(targetPeriod)) {
                return false;
            }
        }


        /*
         * Mathematics morning only
         */

        if (
            isMathematics(subject) &&
            document.getElementById(
                "ruleNoMathsAfternoon"
            )?.checked
        ) {

            if (
                isAfternoonPeriod(
                    targetPeriod
                )
            ) {
                return false;
            }
        }


        /*
         * Do not place a teaching lesson in
         * a non-teaching period.
         */

        if (
            !periodIsTeaching(targetPeriod)
        ) {
            return false;
        }


        return true;
    }



    /* ========================================================
       MOVE GROUP
       ======================================================== */

    function getMoveGroup(
        entry,
        entries
    ) {

        const preserveDoubles =
            document.getElementById(
                "rulePreserveDoubles"
            )?.checked;


        const preserveParallel =
            document.getElementById(
                "rulePreserveParallel"
            )?.checked;


        let group = [entry];


        if (preserveDoubles) {

            const doubles =
                getDoubleGroup(
                    entry,
                    entries
                );

            if (doubles.length > 1) {

                group =
                    doubles;
            }
        }


        if (preserveParallel) {

            const parallel =
                getParallelEntries(
                    entry,
                    entries
                );

            if (parallel.length > 1) {

                /*
                 * Merge without duplicates.
                 */

                const map =
                    new Map(
                        group.map(
                            item => [
                                item.id,
                                item
                            ]
                        )
                    );


                for (
                    const item
                    of parallel
                ) {

                    map.set(
                        item.id,
                        item
                    );
                }


                group =
                    Array.from(
                        map.values()
                    );
            }
        }


        return group;
    }



    /* ========================================================
       PERIOD CANDIDATES
       ======================================================== */

    function getCandidatePeriods(
        entry
    ) {

        const currentPeriod =
            getPeriod(entry.period_id);

        if (!currentPeriod) {
            return [];
        }


        const sameDayPeriods =
            enhancementState.periods
                .filter(period => {

                    if (
                        !periodIsTeaching(
                            period
                        )
                    ) {
                        return false;
                    }

                    return (
                        dayNumber(period) ===
                        dayNumber(
                            currentPeriod
                        )
                    );
                })
                .sort(
                    (a, b) =>
                        periodOrder(a) -
                        periodOrder(b)
                );


        /*
         * Try the whole school week if same-day
         * movement is insufficient.
         */

        const allTeachingPeriods =
            enhancementState.periods
                .filter(periodIsTeaching)
                .sort(
                    (a, b) =>
                        dayNumber(a) -
                        dayNumber(b) ||
                        periodOrder(a) -
                        periodOrder(b)
                );


        const combined = [
            ...sameDayPeriods,
            ...allTeachingPeriods
        ];


        const seen = new Set();

        return combined.filter(
            period => {

                const key =
                    String(period.id);

                if (seen.has(key)) {
                    return false;
                }

                seen.add(key);

                return (
                    key !==
                    String(
                        entry.period_id
                    )
                );
            }
        );
    }



    /* ========================================================
       SAFE MOVE TEST
       ======================================================== */

    function canMoveGroup(
        group,
        targetPeriod,
        entries
    ) {

        /*
         * All entries in a parallel/double group
         * need compatible target periods.
         */

        if (!group.length) {
            return false;
        }


        /*
         * First make a temporary copy with the
         * moving entries removed.
         */

        const movingIds =
            new Set(
                group.map(
                    entry => entry.id
                )
            );


        const remaining =
            entries.filter(
                entry =>
                    !movingIds.has(
                        entry.id
                    )
            );


        for (
            const entry
            of group
        ) {

            if (
                !canPlaceEntry(
                    entry,
                    targetPeriod,
                    remaining,
                    {
                        preserveStream:
                            document.getElementById(
                                "rulePreserveStreamConflicts"
                            )?.checked,

                        preserveTeacher:
                            document.getElementById(
                                "rulePreserveTeacherConflicts"
                            )?.checked,

                        preserveRoom:
                            document.getElementById(
                                "rulePreserveRoomConflicts"
                            )?.checked
                    }
                )
            ) {

                return false;
            }


            if (
                !targetSatisfiesSpecialRule(
                    entry,
                    targetPeriod
                )
            ) {

                return false;
            }


            if (
                !weeklyCountWouldRemainValid(
                    entry,
                    entries
                )
            ) {

                return false;
            }
        }


        /*
         * Stream uniqueness inside the moving group.
         */

        const streams =
            new Set();


        for (
            const entry
            of group
        ) {

            const streamKey =
                String(
                    entry.stream_id
                );

            if (
                streams.has(
                    streamKey
                )
            ) {

                /*
                 * Two lessons for the same stream cannot
                 * occupy the same target period.
                 */

                return false;
            }

            streams.add(streamKey);
        }


        /*
         * Teacher uniqueness inside the group.
         */

        const teachers =
            new Set();


        for (
            const entry
            of group
        ) {

            if (!entry.teacher_id) {
                continue;
            }

            const teacherKey =
                String(
                    entry.teacher_id
                );

            if (
                teachers.has(
                    teacherKey
                )
            ) {

                return false;
            }

            teachers.add(teacherKey);
        }


        /*
         * Room uniqueness inside the group.
         */

        const rooms =
            new Set();


        for (
            const entry
            of group
        ) {

            if (!entry.room_id) {
                continue;
            }

            const roomKey =
                String(
                    entry.room_id
                );

            if (
                rooms.has(
                    roomKey
                )
            ) {

                return false;
            }

            rooms.add(roomKey);
        }


        return true;
    }



    /* ========================================================
       APPLY MOVE
       ======================================================== */

    function applyMoveGroup(
        group,
        targetPeriod,
        entries
    ) {

        const oldPeriods =
            group.map(
                entry => ({
                    entryId: entry.id,
                    periodId: entry.period_id
                })
            );


        for (
            const entry
            of group
        ) {

            entry.period_id =
                targetPeriod.id;
        }


        enhancementState.changes.push({

            type: "MOVE",

            entryIds:
                group.map(
                    entry => entry.id
                ),

            oldPeriods,

            newPeriodId:
                targetPeriod.id,

            newPeriod:
                targetPeriod
        });
    }



    /* ========================================================
       FIND SAFE MOVE
       ======================================================== */

    function findSafeMove(
        violation,
        entries
    ) {

        const entry =
            entries.find(
                candidate =>
                    candidate.id ===
                    violation.entryId
            );


        if (!entry) {
            return null;
        }


        const group =
            getMoveGroup(
                entry,
                entries
            );


        const candidates =
            getCandidatePeriods(
                entry
            );


        /*
         * Prefer periods that satisfy the special
         * rule first and are close to the current
         * period.
         */

        const currentPeriod =
            getPeriod(
                entry.period_id
            );


        candidates.sort(
            (a, b) => {

                const aScore =
                    scoreTargetPeriod(
                        entry,
                        a,
                        currentPeriod
                    );

                const bScore =
                    scoreTargetPeriod(
                        entry,
                        b,
                        currentPeriod
                    );

                return bScore - aScore;
            }
        );


        for (
            const target
            of candidates
        ) {

            if (
                canMoveGroup(
                    group,
                    target,
                    entries
                )
            ) {

                return {
                    group,
                    target
                };
            }
        }


        return null;
    }



    /* ========================================================
       TARGET SCORING
       ======================================================== */

    function scoreTargetPeriod(
        entry,
        target,
        current
    ) {

        let score = 0;

        const subject =
            getSubject(
                entry.subject_id
            );


        /*
         * Strongly prefer satisfying rules.
         */

        if (
            targetSatisfiesSpecialRule(
                entry,
                target
            )
        ) {
            score += 1000;
        }


        /*
         * Same day is preferable.
         */

        if (
            current &&
            dayNumber(target) ===
                dayNumber(current)
        ) {
            score += 100;
        }


        /*
         * Smaller movement is preferable.
         */

        if (current) {

            const distance =
                Math.abs(
                    periodOrder(target) -
                    periodOrder(current)
                );

            score -= distance;
        }


        /*
         * Morning is strongly preferred for
         * Mathematics.
         */

        if (
            isMathematics(subject) &&
            !isAfternoonPeriod(target)
        ) {
            score += 500;
        }


        /*
         * PPI before break.
         */

        if (
            isPPI(subject) &&
            isBeforeBreak(target)
        ) {
            score += 500;
        }


        return score;
    }



    /* ========================================================
       ENHANCEMENT ENGINE
       ======================================================== */

    async function enhanceTimetable() {

        if (!enhancementState.loaded) {

            throw new Error(
                "Load the generated timetable first."
            );
        }


        enhancementState.enhancedEntries =
            enhancementState.sourceEntries.map(
                entry => ({
                    ...entry
                })
            );


        enhancementState.changes = [];

        enhancementState.enhanced = false;


        let violations =
            checkAllRules(
                enhancementState.enhancedEntries
            );


        enhancementState.originalViolations =
            violations.map(
                violation => ({
                    ...violation
                })
            );


        console.log(
            "🛠️ ORIGINAL ENHANCEMENT VIOLATIONS:",
            violations
        );


        const maxIterations =
            Math.max(
                violations.length * 3,
                20
            );


        let iteration = 0;


        while (
            violations.length > 0 &&
            iteration < maxIterations
        ) {

            iteration++;


            /*
             * Process the highest priority violation.
             */

            violations.sort(
                (a, b) => {

                    const priority = {
                        high: 3,
                        medium: 2,
                        low: 1
                    };

                    return (
                        (priority[b.severity] || 0) -
                        (priority[a.severity] || 0)
                    );
                }
            );


            const violation =
                violations[0];


            const result =
                findSafeMove(
                    violation,
                    enhancementState.enhancedEntries
                );


            if (!result) {

                console.warn(
                    "⚠️ No safe move found:",
                    violation
                );

                /*
                 * Remove it from this pass so that
                 * the engine does not get stuck forever.
                 */

                violation.unresolved = true;

                violations =
                    violations.slice(1);

                continue;
            }


            console.log(
                "🔄 Enhancement move:",
                {
                    violation:
                        violation.message,

                    target:
                        result.target.period_name,

                    targetDay:
                        result.target.day_name
                }
            );


            applyMoveGroup(
                result.group,
                result.target,
                enhancementState.enhancedEntries
            );


            /*
             * Recalculate everything after every move.
             * This prevents a move from creating a hidden
             * conflict that another move does not know about.
             */

            violations =
                checkAllRules(
                    enhancementState.enhancedEntries
                );
        }


        enhancementState.remainingViolations =
            checkAllRules(
                enhancementState.enhancedEntries
            );


        enhancementState.enhanced =
            enhancementState.remainingViolations
                .filter(
                    violation =>
                        !violation.unresolved
                )
                .length === 0;


        console.log(
            "🛠️ ENHANCEMENT COMPLETE",
            {
                iterations:
                    iteration,

                changes:
                    enhancementState.changes.length,

                remaining:
                    enhancementState.remainingViolations.length
            }
        );


        renderEnhancementResults();


        if (
            enhancementState.enhanced
        ) {

            renderEnhancedTimetable();

            showElement(
                "enhancedTimetableCard"
            );

            showElement(
                "enhancementSaveCard"
            );

        } else {

            /*
             * Even if some rules could not be fixed,
             * show the result so the user can inspect it.
             */

            renderEnhancedTimetable();

            showElement(
                "enhancedTimetableCard"
            );
        }


        return enhancementState;
    }



    /* ========================================================
       RULE CHECK ONLY
       ======================================================== */

    function checkEnhancementRules() {

        if (!enhancementState.loaded) {

            setLoadStatus(
                "⚠️ Load the generated timetable first.",
                "warning"
            );

            return;
        }


        const violations =
            checkAllRules(
                enhancementState.enhancedEntries
            );


        enhancementState.originalViolations =
            violations;


        enhancementState.remainingViolations =
            violations;


        enhancementState.changes = [];


        console.log(
            "🔍 ENHANCEMENT RULE CHECK:",
            violations
        );


        renderEnhancementResults();


        showElement(
            "enhancementResultsCard"
        );
    }



    /* ========================================================
       RESULTS UI
       ======================================================== */

    function renderEnhancementResults() {

        const summary =
            document.getElementById(
                "enhancementSummary"
            );

        const results =
            document.getElementById(
                "enhancementResults"
            );


        if (!summary || !results) {
            return;
        }


        const originalCount =
            enhancementState.originalViolations
                .length;


        const remainingCount =
            enhancementState.remainingViolations
                .length;


        const changeCount =
            enhancementState.changes
                .length;


        summary.innerHTML = `

            <div class="stat-card">
                <strong>Original Violations</strong>
                <span>${originalCount}</span>
            </div>

            <div class="stat-card">
                <strong>Changes Made</strong>
                <span>${changeCount}</span>
            </div>

            <div class="stat-card">
                <strong>Remaining Violations</strong>
                <span>${remainingCount}</span>
            </div>

            <div class="stat-card">
                <strong>Status</strong>
                <span>
                    ${
                        remainingCount === 0
                            ? "✅ Valid"
                            : "⚠️ Review Required"
                    }
                </span>
            </div>
        `;


        if (!remainingCount) {

            results.innerHTML = `

                <div class="success-message">

                    <h4>
                        ✅ Enhancement successful
                    </h4>

                    <p>
                        All selected enhancement rules
                        are satisfied.
                    </p>

                    <p>
                        ${changeCount}
                        safe timetable change(s) were made.
                    </p>

                </div>
            `;

            return;
        }


        results.innerHTML = `

            <div class="warning-message">

                <h4>
                    ⚠️ Some rules could not be satisfied
                </h4>

                <p>
                    The engine refused unsafe moves rather
                    than creating teacher, stream, room,
                    double or parallel conflicts.
                </p>

            </div>

            <div class="enhancement-violations">

                ${enhancementState.remainingViolations
                    .map(
                        violation => {

                            const d =
                                describeEntry(
                                    violation.entry
                                );

                            return `
                                <div
                                    class="conflict-item"
                                    style="
                                        padding:12px;
                                        margin:8px 0;
                                        border:1px solid #ddd;
                                        border-radius:8px;
                                    "
                                >

                                    <strong>
                                        ${escapeHtml(
                                            violation.type
                                        )}
                                    </strong>

                                    <div>
                                        ${escapeHtml(
                                            violation.message
                                        )}
                                    </div>

                                </div>
                            `;
                        }
                    )
                    .join("")}

            </div>
        `;


        showElement(
            "enhancementResultsCard"
        );
    }



    /* ========================================================
       ENHANCED TIMETABLE RENDERER
       ======================================================== */

    function renderEnhancedTimetable() {

        const container =
            document.getElementById(
                "enhancedTimetableContent"
            );


        if (!container) {
            return;
        }


        const entries =
            enhancementState.enhancedEntries;


        if (!entries.length) {

            container.innerHTML = `
                <div class="empty-state">
                    No enhanced timetable entries.
                </div>
            `;

            return;
        }


        /*
         * Group entries by stream.
         */

        const byStream =
            new Map();


        for (const entry of entries) {

            const key =
                String(
                    entry.stream_id
                );

            if (!byStream.has(key)) {

                byStream.set(
                    key,
                    []
                );
            }

            byStream
                .get(key)
                .push(entry);
        }


        const streams =
            Array.from(
                byStream.keys()
            ).sort(
                (a, b) => {

                    const sa =
                        getStream(a);

                    const sb =
                        getStream(b);

                    return String(
                        sa?.stream_name || a
                    ).localeCompare(
                        String(
                            sb?.stream_name || b
                        ),
                        undefined,
                        {
                            numeric: true
                        }
                    );
                }
            );


        let html = "";


        for (
            const streamId
            of streams
        ) {

            const stream =
                getStream(streamId);


            const streamEntries =
                byStream.get(
                    streamId
                );


            const days =
                Array.from(
                    new Set(
                        streamEntries
                            .map(
                                entry =>
                                    dayNumber(
                                        getPeriod(
                                            entry.period_id
                                        )
                                    )
                            )
                            .filter(
                                day =>
                                    Number.isFinite(day)
                            )
                    )
                ).sort(
                    (a, b) => a - b
                );


            html += `

                <div
                    class="enhanced-stream-block"
                    style="
                        margin-bottom:30px;
                    "
                >

                    <h4>
                        📚 ${escapeHtml(
                            stream?.stream_name ||
                            "Stream"
                        )}
                    </h4>

                    <div
                        style="
                            overflow-x:auto;
                        "
                    >

                        <table
                            class="data-table"
                            style="
                                width:100%;
                                border-collapse:collapse;
                            "
                        >

                            <thead>

                                <tr>

                                    <th>Day</th>
                                    <th>Period</th>
                                    <th>Time</th>
                                    <th>Subject</th>
                                    <th>Teacher</th>
                                    <th>Room</th>

                                </tr>

                            </thead>

                            <tbody>
            `;


            for (
                const day
                of days
            ) {

                const dayEntries =
                    streamEntries
                        .filter(
                            entry =>
                                dayNumber(
                                    getPeriod(
                                        entry.period_id
                                    )
                                ) === day
                        )
                        .sort(
                            (a, b) =>
                                periodOrder(
                                    getPeriod(
                                        a.period_id
                                    )
                                ) -
                                periodOrder(
                                    getPeriod(
                                        b.period_id
                                    )
                                )
                        );


                for (
                    const entry
                    of dayEntries
                ) {

                    const period =
                        getPeriod(
                            entry.period_id
                        );

                    const subject =
                        getSubject(
                            entry.subject_id
                        );

                    const teacher =
                        getTeacher(
                            entry.teacher_id
                        );

                    const room =
                        getRoom(
                            entry.room_id
                        );


                    html += `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    period?.day_name ||
                                    ""
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    period?.period_name ||
                                    ""
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    period?.start_time ||
                                    ""
                                )}
                                -
                                ${escapeHtml(
                                    period?.end_time ||
                                    ""
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${escapeHtml(
                                        subject?.subject_name ||
                                        "Unknown"
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(
                                    teacher?.full_name ||
                                    "Unassigned"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    room?.room_name ||
                                    room?.name ||
                                    ""
                                )}
                            </td>

                        </tr>
                    `;
                }
            }


            html += `

                            </tbody>

                        </table>

                    </div>

                </div>
            `;
        }


        container.innerHTML = html;
    }



    /* ========================================================
       ESCAPE HTML
       ======================================================== */

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }



    /* ========================================================
       SAVE ENHANCED TIMETABLE
       ======================================================== */

    async function saveEnhancedTimetable() {

        if (
            !enhancementState.enhancedEntries.length
        ) {

            throw new Error(
                "There is no enhanced timetable to save."
            );
        }


        /*
         * Never save a timetable that still violates
         * the selected rules.
         */

        const finalViolations =
            checkAllRules(
                enhancementState.enhancedEntries
            );


        if (finalViolations.length > 0) {

            throw new Error(
                `Cannot save. ${finalViolations.length} selected rule violation(s) remain.`
            );
        }


        const supabase =
            getSupabase();


        /*
         * Generate a unique enhancement ID.
         */

        enhancementState.enhancementGenerationId =
            crypto.randomUUID();


        setSaveStatus(
            "⏳ Saving enhanced timetable...",
            "loading"
        );


        /*
         * Prepare rows.
         */

        const rows =
            enhancementState.enhancedEntries
                .map(entry => ({

                    school_id:
                        enhancementState.schoolId,

                    enhancement_generation_id:
                        enhancementState
                            .enhancementGenerationId,

                    source_entry_id:
                        entry.id,

                    period_id:
                        entry.period_id,

                    stream_id:
                        entry.stream_id,

                    subject_id:
                        entry.subject_id,

                    teacher_id:
                        entry.teacher_id ||
                        null,

                    room_id:
                        entry.room_id ||
                        null
                }));


        /*
         * Insert in batches.
         */

        const BATCH_SIZE = 500;


        for (
            let i = 0;
            i < rows.length;
            i += BATCH_SIZE
        ) {

            const batch =
                rows.slice(
                    i,
                    i + BATCH_SIZE
                );


            const { error } =
                await supabase
                    .from(
                        "timetable_enhanced_entries"
                    )
                    .insert(batch);


            if (error) {

                throw new Error(
                    `Failed saving enhanced timetable: ${error.message}`
                );
            }


            console.log(
                `💾 Saved enhanced rows ${i + 1}-${i + batch.length}`
            );
        }


        enhancementState.saved = true;


        setSaveStatus(
            `✅ Enhanced timetable saved successfully. ${rows.length} entries saved.`,
            "success"
        );


        console.log(
            "💾 ENHANCED TIMETABLE SAVED",
            {
                generationId:
                    enhancementState
                        .enhancementGenerationId,

                entries:
                    rows.length
            }
        );
    }



    /* ========================================================
       OPEN / CLOSE PANEL
       ======================================================== */

    function openEnhancementPanel() {

        showElement(
            "timetableEnhancementPanel"
        );

        hideElement(
            "enhancementOpenActions"
        );

        console.log(
            "🛠️ Timetable Enhancement panel opened."
        );
    }


    function closeEnhancementPanel() {

        hideElement(
            "timetableEnhancementPanel"
        );

        showElement(
            "enhancementOpenActions"
        );
    }



    /* ========================================================
       GET SCHOOL ID
       ======================================================== */

    function detectSchoolId() {

        /*
         * First use timetableState if available.
         */

        if (
            typeof timetableState !==
            "undefined" &&
            timetableState?.schoolId
        ) {

            return timetableState.schoolId;
        }


        /*
         * Try window.timetableState.
         */

        if (
            window.timetableState?.schoolId
        ) {

            return window
                .timetableState
                .schoolId;
        }


        /*
         * Try selected school information
         * used by the existing application.
         */

        if (
            window.currentSchoolId
        ) {

            return window.currentSchoolId;
        }


        /*
         * Try localStorage.
         */

        const possibleKeys = [
            "school_id",
            "schoolId",
            "currentSchoolId"
        ];


        for (
            const key
            of possibleKeys
        ) {

            const value =
                localStorage.getItem(
                    key
                );

            if (value) {
                return value;
            }
        }


        return null;
    }



    /* ========================================================
       INITIALIZATION
       ======================================================== */

    function initializeEnhancement() {

        if (
            enhancementState.initialized
        ) {
            return;
        }


        enhancementState.initialized =
            true;


        const openButton =
            document.getElementById(
                "openTimetableEnhancementBtn"
            );


        const loadButton =
            document.getElementById(
                "loadEnhancementTimetableBtn"
            );


        const checkButton =
            document.getElementById(
                "checkEnhancementRulesBtn"
            );


        const enhanceButton =
            document.getElementById(
                "applyEnhancementRulesBtn"
            );


        const saveButton =
            document.getElementById(
                "saveEnhancedTimetableBtn"
            );


        const cancelButton =
            document.getElementById(
                "cancelTimetableEnhancementBtn"
            );


        if (openButton) {

            openButton.addEventListener(
                "click",
                openEnhancementPanel
            );
        }


        if (loadButton) {

            loadButton.addEventListener(
                "click",
                async () => {

                    try {

                        enhancementState.schoolId =
                            detectSchoolId();


                        if (
                            !enhancementState.schoolId
                        ) {

                            throw new Error(
                                "Could not determine the current school ID."
                            );
                        }


                        await loadEnhancementData();

                    } catch (error) {

                        console.error(
                            "❌ Enhancement load error:",
                            error
                        );

                        setLoadStatus(
                            `❌ ${error.message}`,
                            "error"
                        );
                    }
                }
            );
        }


        if (checkButton) {

            checkButton.addEventListener(
                "click",
                () => {

                    try {

                        checkEnhancementRules();

                    } catch (error) {

                        console.error(
                            "❌ Rule check error:",
                            error
                        );

                        alert(
                            `Rule check failed:\n\n${error.message}`
                        );
                    }
                }
            );
        }


        if (enhanceButton) {

            enhanceButton.addEventListener(
                "click",
                async () => {

                    try {

                        enhanceButton.disabled =
                            true;

                        enhanceButton.textContent =
                            "⏳ Enhancing...";


                        showElement(
                            "enhancementResultsCard"
                        );


                        await enhanceTimetable();

                    } catch (error) {

                        console.error(
                            "❌ Enhancement error:",
                            error
                        );

                        alert(
                            `Enhancement failed:\n\n${error.message}`
                        );

                    } finally {

                        enhanceButton.disabled =
                            false;

                        enhanceButton.textContent =
                            "⚡ Enhance Timetable";
                    }
                }
            );
        }


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                async () => {

                    try {

                        saveButton.disabled =
                            true;

                        saveButton.textContent =
                            "⏳ Saving...";


                        await saveEnhancedTimetable();

                    } catch (error) {

                        console.error(
                            "❌ Save error:",
                            error
                        );

                        setSaveStatus(
                            `❌ ${error.message}`,
                            "error"
                        );

                    } finally {

                        saveButton.disabled =
                            false;

                        saveButton.textContent =
                            "💾 Save Enhanced Timetable";
                    }
                }
            );
        }


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                closeEnhancementPanel
            );
        }


        console.log(
            "✅ Timetable Enhancement Engine initialized."
        );
    }



    /* ========================================================
       DOM READY
       ======================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeEnhancement
        );

    } else {

        initializeEnhancement();
    }



    /* ========================================================
       PUBLIC API
       ======================================================== */

    window.timetableEnhancement = {

        state:
            enhancementState,

        load:
            loadEnhancementData,

        check:
            checkEnhancementRules,

        enhance:
            enhanceTimetable,

        save:
            saveEnhancedTimetable,

        render:
            renderEnhancedTimetable,

        open:
            openEnhancementPanel,

        close:
            closeEnhancementPanel
    };


    console.log(
        "🛠️ Timetable Enhancement Engine ready."
    );

})();
