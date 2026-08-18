

let generatedTimetableEntries = [];

let timetableGenerationRunning = false;


// ============================================================
// GET TIMETABLE DOM ELEMENTS
// ============================================================

const generateTimetableBtn =
    document.getElementById(
        "generateTimetableBtn"
    );

const regenerateTimetableBtn =
    document.getElementById(
        "regenerateTimetableBtn"
    );

const clearTimetableBtn =
    document.getElementById(
        "clearTimetableBtn"
    );

const printTimetableBtn =
    document.getElementById(
        "printTimetableBtn"
    );

const timetableStreamFilter =
    document.getElementById(
        "timetableStreamFilter"
    );

const timetableDayFilter =
    document.getElementById(
        "timetableDayFilter"
    );

const timetableViewMode =
    document.getElementById(
        "timetableViewMode"
    );


console.log(
    "Generate button:",
    generateTimetableBtn
);

console.log(
    "Timetable generator DOM check:",
    {

        generate:
            !!generateTimetableBtn,

        regenerate:
            !!regenerateTimetableBtn,

        clear:
            !!clearTimetableBtn,

        print:
            !!printTimetableBtn,

        streamFilter:
            !!timetableStreamFilter,

        dayFilter:
            !!timetableDayFilter,

        viewMode:
            !!timetableViewMode

    }
);



// ============================================================
// STAGE 2 — NORMALIZED GENERATOR DATA MODEL
// ============================================================

const generatorData = {
    school: null,

    streams: [],
    subjects: [],
    teachers: [],
    rooms: [],
    periods: [],
    requirements: [],

    lookup: {
        streams: new Map(),
        subjects: new Map(),
        teachers: new Map(),
        rooms: new Map(),
        periods: new Map()
    }
};







// ============================================================
// GENERATION STATUS
// ============================================================

function setTimetableGenerationStatus(
    message,
    type = "info"
) {

    const status =
        document.getElementById(
            "timetableGenerationStatus"
        );

    if (!status) {

        console.log(
            "[TIMETABLE STATUS]",
            message
        );

        return;

    }

    status.style.display =
        "block";

    status.innerHTML = `
        <div class="timetable-status ${type}">
            ${
                typeof escapeHtml === "function"
                    ? escapeHtml(message)
                    : message
            }
        </div>
    `;

}


// ============================================================
// HIDE GENERATION STATUS
// ============================================================

function hideTimetableGenerationStatus() {

    const status =
        document.getElementById(
            "timetableGenerationStatus"
        );

    if (!status) {
        return;
    }

    status.style.display =
        "none";

    status.innerHTML =
        "";

}


// ============================================================
// LOAD GENERATOR DATA
// ============================================================

async function loadTimetableGeneratorData() {

    if (!timetableState.schoolId) {

        throw new Error(
            "Please select a school first."
        );

    }


    console.log(
        "======================================"
    );

    console.log(
        "LOADING TIMETABLE GENERATOR DATA"
    );

    console.log(
        "School:",
        timetableState.schoolId
    );

    console.log(
        "======================================"
    );


    const schoolId =
        timetableState.schoolId;


    // ========================================================
    // LOAD ALL REQUIRED DATA
    // ========================================================

    const [

        requirementsResult,

        periodsResult,

        streamsResult,

        subjectsResult,

        teachersResult,

        roomsResult

    ] = await Promise.all([

        supabaseClient
            .from("timetable_requirements")
            .select("*")
            .eq("school_id", schoolId),

        supabaseClient
            .from("timetable_periods")
            .select("*")
            .eq("school_id", schoolId)
            .order(
                "day_number",
                {
                    ascending: true
                }
            )
            .order(
                "period_order",
                {
                    ascending: true
                }
            ),

        supabaseClient
            .from("timetable_streams")
            .select("*")
            .eq("school_id", schoolId),

        supabaseClient
            .from("timetable_subjects")
            .select("*")
            .eq("school_id", schoolId),

        supabaseClient
            .from("timetable_teachers")
            .select("*")
            .eq("school_id", schoolId),

        supabaseClient
            .from("timetable_rooms")
            .select("*")
            .eq("school_id", schoolId)

    ]);


    // ========================================================
    // CHECK DATABASE ERRORS
    // ========================================================

    if (requirementsResult.error) {

        throw new Error(
            "Failed to load timetable requirements: " +
            requirementsResult.error.message
        );

    }


    if (periodsResult.error) {

        throw new Error(
            "Failed to load timetable periods: " +
            periodsResult.error.message
        );

    }


    if (streamsResult.error) {

        throw new Error(
            "Failed to load timetable streams: " +
            streamsResult.error.message
        );

    }


    if (subjectsResult.error) {

        throw new Error(
            "Failed to load timetable subjects: " +
            subjectsResult.error.message
        );

    }


    if (teachersResult.error) {

        throw new Error(
            "Failed to load timetable teachers: " +
            teachersResult.error.message
        );

    }


    if (roomsResult.error) {

        throw new Error(
            "Failed to load timetable rooms: " +
            roomsResult.error.message
        );

    }


    // ========================================================
    // BUILD RESULT
    // ========================================================

    const result = {

        requirements:
            requirementsResult.data || [],

        periods:
            periodsResult.data || [],

        streams:
            streamsResult.data || [],

        subjects:
            subjectsResult.data || [],

        teachers:
            teachersResult.data || [],

        rooms:
            roomsResult.data || []

    };


    // ========================================================
    // LOG COUNTS
    // ========================================================

    console.log(
        "Generator requirements:",
        result.requirements.length
    );

    console.log(
        "Generator periods:",
        result.periods.length
    );

    console.log(
        "Generator streams:",
        result.streams.length
    );

    console.log(
        "Generator subjects:",
        result.subjects.length
    );

    console.log(
        "Generator teachers:",
        result.teachers.length
    );

    console.log(
        "Generator rooms:",
        result.rooms.length
    );


    return result;

}


// ============================================================
// BUILD LOOKUP MAPS
// ============================================================

function buildTimetableLookupMaps(
    data
) {

    const streams =
        new Map();

    const subjects =
        new Map();

    const teachers =
        new Map();

    const rooms =
        new Map();

    const periods =
        new Map();


    data.streams.forEach(
        function (item) {

            streams.set(
                item.id,
                item
            );

        }
    );


    data.subjects.forEach(
        function (item) {

            subjects.set(
                item.id,
                item
            );

        }
    );


    data.teachers.forEach(
        function (item) {

            teachers.set(
                item.id,
                item
            );

        }
    );


    data.rooms.forEach(
        function (item) {

            rooms.set(
                item.id,
                item
            );

        }
    );


    data.periods.forEach(
        function (item) {

            periods.set(
                item.id,
                item
            );

        }
    );


    return {

        streams,
        subjects,
        teachers,
        rooms,
        periods

    };

}




// ============================================================
// STAGE 2 — NORMALIZE GENERATOR DATA
// ============================================================

function normalizeGeneratorData(data) {

    const normalized = {
        school: data.school || null,

        streams: Array.isArray(data.streams)
            ? data.streams
            : [],

        subjects: Array.isArray(data.subjects)
            ? data.subjects
            : [],

        teachers: Array.isArray(data.teachers)
            ? data.teachers
            : [],

        rooms: Array.isArray(data.rooms)
            ? data.rooms
            : [],

        periods: Array.isArray(data.periods)
            ? data.periods
            : [],

        requirements: Array.isArray(data.requirements)
            ? data.requirements
            : [],

        lookup: {
            streams: new Map(),
            subjects: new Map(),
            teachers: new Map(),
            rooms: new Map(),
            periods: new Map()
        }
    };


    // ----------------------------------------------------------
    // BUILD LOOKUP MAPS
    // ----------------------------------------------------------

    normalized.streams.forEach(stream => {

        if (stream?.id) {
            normalized.lookup.streams.set(
                stream.id,
                stream
            );
        }

    });


    normalized.subjects.forEach(subject => {

        if (subject?.id) {
            normalized.lookup.subjects.set(
                subject.id,
                subject
            );
        }

    });


    normalized.teachers.forEach(teacher => {

        if (teacher?.id) {
            normalized.lookup.teachers.set(
                teacher.id,
                teacher
            );
        }

    });


    normalized.rooms.forEach(room => {

        if (room?.id) {
            normalized.lookup.rooms.set(
                room.id,
                room
            );

        }

    });


    normalized.periods.forEach(period => {

        if (period?.id) {
            normalized.lookup.periods.set(
                period.id,
                period
            );

        }

    });


    // ----------------------------------------------------------
    // NORMALIZE REQUIREMENTS
    // ----------------------------------------------------------

    normalized.requirements =
        normalized.requirements.map(requirement => {

            return {

                requirementId:
                    requirement.id,

                schoolId:
                    requirement.school_id,

                streamId:
                    requirement.stream_id,

                subjectId:
                    requirement.subject_id,

                teacherId:
                    requirement.teacher_id || null,

                lessonsPerWeek:
                    Number(
                        requirement.lessons_per_week
                    ) || 0,

                doubleLessonsPerWeek:
                    Number(
                        requirement.double_lessons_per_week
                    ) || 0,

                requiresRoom:
                    Boolean(
                        requirement.requires_room
                    ),

                roomType:
                    requirement.room_type || null,

                maxLessonsPerDay:
                    Number(
                        requirement.max_lessons_per_day
                    ) || 1
            };

        });


    return normalized;
}



// ============================================================
// STAGE 2 — VERIFY GENERATOR RELATIONSHIPS
// ============================================================

function validateGeneratorRelationships(data) {

    const errors = [];
    const warnings = [];


    // ----------------------------------------------------------
    // REQUIREMENTS
    // ----------------------------------------------------------

    data.requirements.forEach(requirement => {

        if (!requirement.requirementId) {

            errors.push({
                type: "INVALID_REQUIREMENT",
                message:
                    "Requirement has no ID."
            });

            return;
        }


        // STREAM

        if (
            !data.lookup.streams.has(
                requirement.streamId
            )
        ) {

            errors.push({

                type: "MISSING_STREAM",

                requirementId:
                    requirement.requirementId,

                streamId:
                    requirement.streamId,

                message:
                    "Requirement references a stream that does not exist."
            });

        }


        // SUBJECT

        if (
            !data.lookup.subjects.has(
                requirement.subjectId
            )
        ) {

            errors.push({

                type: "MISSING_SUBJECT",

                requirementId:
                    requirement.requirementId,

                subjectId:
                    requirement.subjectId,

                message:
                    "Requirement references a subject that does not exist."
            });

        }


        // TEACHER

        if (!requirement.teacherId) {

            warnings.push({

                type: "MISSING_TEACHER",

                requirementId:
                    requirement.requirementId,

                message:
                    "Requirement has no teacher assigned."
            });

        }

        else if (
            !data.lookup.teachers.has(
                requirement.teacherId
            )
        ) {

            errors.push({

                type: "MISSING_TEACHER",

                requirementId:
                    requirement.requirementId,

                teacherId:
                    requirement.teacherId,

                message:
                    "Requirement references a teacher that does not exist."
            });

        }


        // LESSONS

        if (
            requirement.lessonsPerWeek <= 0
        ) {

            errors.push({

                type: "INVALID_LESSONS_PER_WEEK",

                requirementId:
                    requirement.requirementId,

                message:
                    "Lessons per week must be greater than zero."
            });

        }


        // DOUBLE LESSONS

        if (
            requirement.doubleLessonsPerWeek <
            0
        ) {

            errors.push({

                type: "INVALID_DOUBLE_LESSONS",

                requirementId:
                    requirement.requirementId,

                message:
                    "Double lessons per week cannot be negative."
            });

        }


        if (
            requirement.doubleLessonsPerWeek >
            requirement.lessonsPerWeek
        ) {

            errors.push({

                type: "INVALID_DOUBLE_LESSONS",

                requirementId:
                    requirement.requirementId,

                message:
                    "Double lessons per week cannot exceed lessons per week."
            });

        }

    });


    // ----------------------------------------------------------
    // RESULT
    // ----------------------------------------------------------

    return {
        valid:
            errors.length === 0,

        errors,
        warnings
    };
}

















// ============================================================
// PART 2 — NORMALIZATION, VALIDATION & LESSON TASKS
// ============================================================


// ============================================================
// GET DISPLAY NAME — STREAM
// ============================================================

function getTimetableStreamName(stream) {

    if (!stream) {
        return "Unknown Stream";
    }

    return (
        stream.stream_name ||
        stream.name ||
        stream.class_name ||
        "Unknown Stream"
    );

}


// ============================================================
// GET DISPLAY NAME — SUBJECT
// ============================================================

function getTimetableSubjectName(subject) {

    if (!subject) {
        return "Unknown Subject";
    }

    return (
        subject.subject_name ||
        subject.name ||
        subject.subject ||
        "Unknown Subject"
    );

}


// ============================================================
// GET DISPLAY NAME — TEACHER
// ============================================================

function getTimetableTeacherName(teacher) {

    if (!teacher) {
        return "Unassigned";
    }

    const fullName = [
        teacher.first_name,
        teacher.last_name
    ]
        .filter(Boolean)
        .join(" ");

    return (
        teacher.teacher_name ||
        teacher.name ||
        teacher.full_name ||
        fullName ||
        teacher.username ||
        "Unknown Teacher"
    );

}


// ============================================================
// GET DISPLAY NAME — ROOM
// ============================================================

function getTimetableRoomName(room) {

    if (!room) {
        return "No Room";
    }

    return (
        room.room_name ||
        room.name ||
        room.room ||
        "Room"
    );

}


// ============================================================
// NORMALIZE ROOM TYPE
// ============================================================

function normalizeRoomType(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim()
        .toLowerCase();

}


// ============================================================
// GET ROOM TYPE
// ============================================================

function getTimetableRoomType(room) {

    if (!room) {
        return "";
    }

    return normalizeRoomType(
        room.room_type ||
        room.type ||
        room.category ||
        ""
    );

}


// ============================================================
// VALIDATE GENERATOR DATA
// ============================================================

function validateTimetableGeneratorData(data) {

    const errors = [];


    if (
        !data ||
        typeof data !== "object"
    ) {

        throw new Error(
            "Invalid timetable generator data."
        );

    }


    if (
        !Array.isArray(data.requirements) ||
        data.requirements.length === 0
    ) {

        errors.push(
            "No timetable requirements have been configured."
        );

    }


    if (
        !Array.isArray(data.periods) ||
        data.periods.length === 0
    ) {

        errors.push(
            "No timetable periods have been configured."
        );

    }


    if (
        !Array.isArray(data.streams) ||
        data.streams.length === 0
    ) {

        errors.push(
            "No streams have been configured."
        );

    }


    if (
        !Array.isArray(data.subjects) ||
        data.subjects.length === 0
    ) {

        errors.push(
            "No subjects have been configured."
        );

    }


    if (
        !Array.isArray(data.teachers) ||
        data.teachers.length === 0
    ) {

        errors.push(
            "No teachers have been configured."
        );

    }


    if (
        !Array.isArray(data.rooms)
    ) {

        errors.push(
            "Room data could not be loaded."
        );

    }


    if (errors.length > 0) {

        throw new Error(
            errors.join("\n")
        );

    }


    console.log(
        "Generator data validation: PASSED"
    );


    return true;

}


// ============================================================
// GET TEACHING PERIODS
// ============================================================

function getTeachingPeriods(periods) {

    if (!Array.isArray(periods)) {
        return [];
    }


    return periods.filter(
        period => {

            const periodType =
                String(
                    period.period_type || ""
                )
                    .trim()
                    .toLowerCase();


            return (

                period.is_teaching_period !== false &&

                periodType !== "break" &&

                periodType !== "lunch"

            );

        }
    );

}


// ============================================================
// GROUP PERIODS BY DAY
// ============================================================

function groupPeriodsByDay(periods) {

    const groups = {};


    if (!Array.isArray(periods)) {
        return groups;
    }


    periods.forEach(
        period => {

            const day =
                period.day_name ||
                `Day ${period.day_number}`;


            if (!groups[day]) {

                groups[day] = [];

            }


            groups[day].push(
                period
            );

        }
    );


    Object.keys(groups)
        .forEach(
            day => {

                groups[day].sort(
                    (
                        a,
                        b
                    ) => {

                        const orderA =
                            Number(
                                a.period_order
                            ) || 0;

                        const orderB =
                            Number(
                                b.period_order
                            ) || 0;


                        return (
                            orderA -
                            orderB
                        );

                    }
                );

            }
        );


    return groups;

}


// ============================================================
// CREATE LESSON TASKS
// ============================================================
//
// Example:
//
// lessons_per_week = 5
// double_lessons_per_week = 2
//
// Creates:
//
// Double block 1 = 2 periods
// Double block 2 = 2 periods
// Single lesson  = 1 period
//
// Total = 5 periods
//
// ============================================================

function createLessonTasks(
    requirements,
    lookup
) {

    const tasks = [];


    if (!Array.isArray(requirements)) {

        console.warn(
            "createLessonTasks: requirements is not an array."
        );

        return tasks;

    }


    requirements.forEach(
        requirement => {

            const lessonsPerWeek =
                Number(
                    requirement.lessons_per_week
                ) || 0;


            if (
                lessonsPerWeek <= 0
            ) {

                return;

            }


            const doubleLessons =
                Math.max(
                    0,
                    Number(
                        requirement.double_lessons_per_week
                    ) || 0
                );


            const stream =
                lookup.streams.get(
                    requirement.stream_id
                );


            const subject =
                lookup.subjects.get(
                    requirement.subject_id
                );


            const teacher =
                requirement.teacher_id
                    ? lookup.teachers.get(
                        requirement.teacher_id
                    )
                    : null;


            // ------------------------------------------------
            // VALIDATE REFERENCES
            // ------------------------------------------------

            if (!stream) {

                console.warn(
                    "Requirement references missing stream:",
                    requirement.id,
                    requirement.stream_id
                );

                return;

            }


            if (!subject) {

                console.warn(
                    "Requirement references missing subject:",
                    requirement.id,
                    requirement.subject_id
                );

                return;

            }


            if (
                requirement.teacher_id &&
                !teacher
            ) {

                console.warn(
                    "Requirement references missing teacher:",
                    requirement.id,
                    requirement.teacher_id
                );

            }


            // ------------------------------------------------
            // CALCULATE DOUBLE BLOCKS
            // ------------------------------------------------

            const requestedDoubleBlocks =
                Math.min(
                    doubleLessons,
                    Math.floor(
                        lessonsPerWeek / 2
                    )
                );


            // ------------------------------------------------
            // CREATE DOUBLE LESSON TASKS
            // ------------------------------------------------

            for (
                let i = 0;
                i < requestedDoubleBlocks;
                i++
            ) {

                tasks.push({

                    taskId:
                        `${requirement.id}-double-${i}`,

                    requirementId:
                        requirement.id,

                    streamId:
                        requirement.stream_id,

                    subjectId:
                        requirement.subject_id,

                    teacherId:
                        requirement.teacher_id ||
                        null,

                    requiresRoom:
                        requirement.requires_room === true,

                    roomType:
                        normalizeRoomType(
                            requirement.room_type
                        ),

                    maxLessonsPerDay:
                        Number(
                            requirement.max_lessons_per_day
                        ) || 0,

                    isDouble:
                        true,

                    lessonIndex:
                        i,

                    lessonsRequired:
                        2

                });

            }


            // ------------------------------------------------
            // CREATE SINGLE LESSON TASKS
            // ------------------------------------------------

            const singleLessons =
                lessonsPerWeek -
                (
                    requestedDoubleBlocks *
                    2
                );


            for (
                let i = 0;
                i < singleLessons;
                i++
            ) {

                tasks.push({

                    taskId:
                        `${requirement.id}-single-${i}`,

                    requirementId:
                        requirement.id,

                    streamId:
                        requirement.stream_id,

                    subjectId:
                        requirement.subject_id,

                    teacherId:
                        requirement.teacher_id ||
                        null,

                    requiresRoom:
                        requirement.requires_room === true,

                    roomType:
                        normalizeRoomType(
                            requirement.room_type
                        ),

                    maxLessonsPerDay:
                        Number(
                            requirement.max_lessons_per_day
                        ) || 0,

                    isDouble:
                        false,

                    lessonIndex:
                        requestedDoubleBlocks +
                        i,

                    lessonsRequired:
                        1

                });

            }

        }
    );


    // ========================================================
    // DOUBLE LESSONS FIRST
    // ========================================================

    tasks.sort(
        (
            a,
            b
        ) => {

            if (
                a.isDouble !==
                b.isDouble
            ) {

                return a.isDouble
                    ? -1
                    : 1;

            }

            return 0;

        }
    );


    // ========================================================
    // LOG RESULT
    // ========================================================

    console.log(
        "Lesson tasks created:",
        tasks.length
    );


    console.table(
        tasks.map(
            task => ({

                taskId:
                    task.taskId,

                streamId:
                    task.streamId,

                subjectId:
                    task.subjectId,

                teacherId:
                    task.teacherId,

                requiresRoom:
                    task.requiresRoom,

                roomType:
                    task.roomType,

                double:
                    task.isDouble,

                periods:
                    task.lessonsRequired

            })
        )
    );


    return tasks;

}
// ============================================================
// PART 3 — SLOT AVAILABILITY & OCCUPANCY ENGINE
// ============================================================




// ============================================================
// PART 3 — SLOT AVAILABILITY & OCCUPANCY ENGINE
// ============================================================


// ============================================================
// SHUFFLE ARRAY
// ============================================================

function shuffleArray(array) {

    if (!Array.isArray(array)) {
        return [];
    }

    const result = [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];

    }

    return result;

}


// ============================================================
// NORMALIZE ID
// ============================================================

function normalizeTimetableId(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value);

}


// ============================================================
// CHECK IF TWO PERIODS ARE CONSECUTIVE
// ============================================================

function arePeriodsConsecutive(
    first,
    second
) {

    if (
        !first ||
        !second
    ) {

        return false;

    }


    // --------------------------------------------------------
    // SAME DAY
    // --------------------------------------------------------

    const firstDay =
        Number(
            first.day_number
        );


    const secondDay =
        Number(
            second.day_number
        );


    if (
        !Number.isNaN(firstDay) &&
        !Number.isNaN(secondDay)
    ) {

        if (
            firstDay !==
            secondDay
        ) {

            return false;

        }

    }

    else {

        if (
            String(first.day_name || "") !==
            String(second.day_name || "")
        ) {

            return false;

        }

    }


    // --------------------------------------------------------
    // PREFER PERIOD ORDER
    // --------------------------------------------------------

    if (
        first.period_order !== null &&
        first.period_order !== undefined &&
        second.period_order !== null &&
        second.period_order !== undefined
    ) {

        return (
            Number(second.period_order) ===
            Number(first.period_order) + 1
        );

    }


    // --------------------------------------------------------
    // FALLBACK TO PERIOD NUMBER
    // --------------------------------------------------------

    if (
        first.period_number !== null &&
        first.period_number !== undefined &&
        second.period_number !== null &&
        second.period_number !== undefined
    ) {

        return (
            Number(second.period_number) ===
            Number(first.period_number) + 1
        );

    }


    return false;

}


// ============================================================
// SORT PERIODS
// ============================================================

function sortTimetablePeriods(periods) {

    if (!Array.isArray(periods)) {
        return [];
    }


    return [...periods].sort(
        (
            a,
            b
        ) => {

            const dayA =
                Number(a?.day_number) || 0;

            const dayB =
                Number(b?.day_number) || 0;


            if (
                dayA !==
                dayB
            ) {

                return dayA - dayB;

            }


            const orderA =
                Number(
                    a?.period_order ??
                    a?.period_number ??
                    0
                );


            const orderB =
                Number(
                    b?.period_order ??
                    b?.period_number ??
                    0
                );


            return orderA - orderB;

        }
    );

}


// ============================================================
// GET COMPATIBLE ROOMS
// ============================================================

function getCompatibleRooms(
    task,
    rooms
) {

    const availableRooms =
        Array.isArray(rooms)
            ? rooms.filter(Boolean)
            : [];


    // --------------------------------------------------------
    // NO ROOM REQUIRED
    // --------------------------------------------------------

    if (
        !task ||
        !task.requiresRoom
    ) {

        return [null];

    }


    // --------------------------------------------------------
    // ROOM REQUIRED
    // --------------------------------------------------------

    if (
        availableRooms.length === 0
    ) {

        return [];

    }


    const requestedType =
        normalizeRoomType(
            task.roomType
        );


    // --------------------------------------------------------
    // NO SPECIFIC ROOM TYPE
    // --------------------------------------------------------

    if (
        !requestedType
    ) {

        return shuffleArray(
            availableRooms
        );

    }


    // --------------------------------------------------------
    // MATCH ROOM TYPE
    // --------------------------------------------------------

    const matchingRooms =
        availableRooms.filter(
            room => {

                const roomType =
                    normalizeRoomType(
                        getTimetableRoomType(
                            room
                        )
                    );


                return (
                    roomType ===
                    requestedType
                );

            }
        );


    // --------------------------------------------------------
    // IMPORTANT:
    // DO NOT FAIL JUST BECAUSE ROOM TYPE
    // TEXT IS SLIGHTLY DIFFERENT.
    //
    // Example:
    // "Laboratory"
    // "Lab"
    // "laboratory"
    // --------------------------------------------------------

    if (
        matchingRooms.length > 0
    ) {

        return shuffleArray(
            matchingRooms
        );

    }


    // --------------------------------------------------------
    // NO MATCHING ROOM
    // --------------------------------------------------------

    console.warn(
        "No room matches requested type.",
        {
            taskId:
                task.taskId,

            requestedType,

            availableTypes:
                availableRooms.map(
                    room =>
                        getTimetableRoomType(
                            room
                        )
                )

        }
    );


    return [];

}


// ============================================================
// CREATE OCCUPANCY INDEXES
// ============================================================

function createOccupancyIndexes() {

    return {

        // ----------------------------------------------------
        // STREAM / PERIOD
        // ----------------------------------------------------

        streamPeriod:
            new Set(),


        // ----------------------------------------------------
        // TEACHER / PERIOD
        // ----------------------------------------------------

        teacherPeriod:
            new Set(),


        // ----------------------------------------------------
        // ROOM / PERIOD
        // ----------------------------------------------------

        roomPeriod:
            new Set(),


        // ----------------------------------------------------
        // DAILY STREAM LESSONS
        // ----------------------------------------------------

        dailyStreamLessons:
            new Map()

    };

}


// ============================================================
// DAILY STREAM KEY
// ============================================================

function getDailyStreamKey(
    streamId,
    dayNumber
) {

    return (
        `${normalizeTimetableId(streamId)}__${dayNumber}`
    );

}


// ============================================================
// GET DAILY LESSON COUNT
// ============================================================

function getDailyStreamLessonCount(
    indexes,
    streamId,
    dayNumber
) {

    if (
        !indexes ||
        !indexes.dailyStreamLessons
    ) {

        return 0;

    }


    const key =
        getDailyStreamKey(
            streamId,
            dayNumber
        );


    return (
        indexes.dailyStreamLessons.get(
            key
        ) || 0
    );

}


// ============================================================
// INCREMENT DAILY LESSON COUNT
// ============================================================

function incrementDailyStreamLessonCount(
    indexes,
    streamId,
    dayNumber,
    amount = 1
) {

    if (
        !indexes ||
        !indexes.dailyStreamLessons
    ) {

        return;

    }


    const key =
        getDailyStreamKey(
            streamId,
            dayNumber
        );


    const current =
        getDailyStreamLessonCount(
            indexes,
            streamId,
            dayNumber
        );


    indexes.dailyStreamLessons.set(
        key,
        current + amount
    );

}


// ============================================================
// CHECK SINGLE SLOT CONFLICT
// ============================================================

function checkSingleSlotConflict(
    task,
    period,
    room,
    indexes
) {

    if (
        !task ||
        !period ||
        !indexes
    ) {

        return {

            valid:
                false,

            reason:
                "Invalid task, period or occupancy indexes."

        };

    }


    // ========================================================
    // STREAM
    // ========================================================

    const streamId =
        normalizeTimetableId(
            task.streamId
        );


    const periodId =
        normalizeTimetableId(
            period.id
        );


    const streamKey =
        `${streamId}__${periodId}`;


    if (
        indexes.streamPeriod.has(
            streamKey
        )
    ) {

        return {

            valid:
                false,

            reason:
                "Stream already has a lesson in this period."

        };

    }


    // ========================================================
    // TEACHER
    // ========================================================

    const teacherId =
        normalizeTimetableId(
            task.teacherId
        );


    if (
        teacherId
    ) {

        const teacherKey =
            `${teacherId}__${periodId}`;


        if (
            indexes.teacherPeriod.has(
                teacherKey
            )
        ) {

            return {

                valid:
                    false,

                reason:
                    "Teacher is already teaching another stream in this period."

            };

        }

    }


    // ========================================================
    // ROOM
    // ========================================================

    if (
        room &&
        room.id
    ) {

        const roomKey =
            `${normalizeTimetableId(room.id)}__${periodId}`;


        if (
            indexes.roomPeriod.has(
                roomKey
            )
        ) {

            return {

                valid:
                    false,

                reason:
                    "Room is already occupied in this period."

            };

        }

    }


    // ========================================================
    // DAILY LIMIT
    // ========================================================

    const maxPerDay =
        Number(
            task.maxLessonsPerDay
        ) || 0;


    if (
        maxPerDay > 0
    ) {

        const currentCount =
            getDailyStreamLessonCount(
                indexes,
                streamId,
                period.day_number
            );


        if (
            currentCount >=
            maxPerDay
        ) {

            return {

                valid:
                    false,

                reason:
                    "Maximum lessons per day reached for this requirement."

            };

        }

    }


    return {

        valid:
            true,

        reason:
            ""

    };

}


// ============================================================
// RESERVE SLOT
// ============================================================

function reserveSlot(
    task,
    period,
    room,
    indexes
) {

    if (
        !task ||
        !period ||
        !indexes
    ) {

        return;

    }


    const streamId =
        normalizeTimetableId(
            task.streamId
        );


    const periodId =
        normalizeTimetableId(
            period.id
        );


    // --------------------------------------------------------
    // STREAM
    // --------------------------------------------------------

    indexes.streamPeriod.add(
        `${streamId}__${periodId}`
    );


    // --------------------------------------------------------
    // TEACHER
    // --------------------------------------------------------

    const teacherId =
        normalizeTimetableId(
            task.teacherId
        );


    if (
        teacherId
    ) {

        indexes.teacherPeriod.add(
            `${teacherId}__${periodId}`
        );

    }


    // --------------------------------------------------------
    // ROOM
    // --------------------------------------------------------

    if (
        room &&
        room.id
    ) {

        indexes.roomPeriod.add(
            `${normalizeTimetableId(room.id)}__${periodId}`
        );

    }


    // --------------------------------------------------------
    // DAILY COUNT
    //
    // This counts a TIMETABLE PERIOD.
    // A double lesson therefore occupies 2 periods.
    // --------------------------------------------------------

    incrementDailyStreamLessonCount(
        indexes,
        streamId,
        period.day_number,
        1
    );

}


// ============================================================
// CREATE GENERATED ENTRY
// ============================================================

function createGeneratedEntry(
    task,
    period,
    room
) {

    if (
        !task ||
        !period
    ) {

        return null;

    }


    return {

        school_id:
            timetableState.schoolId,

        period_id:
            period.id,

        stream_id:
            task.streamId,

        subject_id:
            task.subjectId,

        teacher_id:
            task.teacherId ||
            null,

        room_id:
            room?.id ||
            null

    };

}


// ============================================================
// PART 4 — FIND VALID SINGLE & DOUBLE LESSON SLOTS
// ============================================================
// ============================================================
// PATCH & ENHANCEMENT — SLOT AVAILABILITY & OCCUPANCY ENGINE
// ============================================================

/**
 * Enhanced Single Lesson Slot Finder with Fallback & Diagnostic Logging
 */
function findSingleLessonSlot(
    task,
    periods,
    rooms,
    indexes
) {
    const orderedPeriods = sortTimetablePeriods(periods);
    const shuffledPeriods = shuffleArray(orderedPeriods);

    let attempts = 0;
    let streamConflicts = 0;
    let teacherConflicts = 0;
    let roomConflicts = 0;
    let dailyLimitConflicts = 0;

    // --------------------------------------------------------
    // PASS 1: Try standard shuffled check across all periods
    // --------------------------------------------------------
    for (const period of shuffledPeriods) {
        if (!period) continue;

        const compatibleRooms = getCompatibleRooms(task, rooms);
        if (compatibleRooms.length === 0) continue;

        for (const room of compatibleRooms) {
            attempts++;
            const check = checkSingleSlotConflict(task, period, room, indexes);

            if (!check.valid) {
                if (check.reason.includes("Stream already")) streamConflicts++;
                else if (check.reason.includes("Teacher is already")) teacherConflicts++;
                else if (check.reason.includes("Room is already")) roomConflicts++;
                else if (check.reason.includes("Maximum lessons")) dailyLimitConflicts++;
                continue;
            }

            return { period, room };
        }
    }

    // --------------------------------------------------------
    // PASS 2: RELAXATION FALLBACK (Daily Limit Override)
    // If placement fails strictly due to maxLessonsPerDay constraints,
    // retry ignoring the daily threshold to prevent unplaced orphan tasks.
    // --------------------------------------------------------
    if (dailyLimitConflicts > 0 && streamConflicts === 0 && teacherConflicts === 0) {
        console.warn("⚠️ Relaxing maxLessonsPerDay constraint for task to prevent deadlock:", {
            taskId: task.taskId,
            streamId: task.streamId,
            subjectId: task.subjectId
        });

        for (const period of shuffledPeriods) {
            if (!period) continue;
            const compatibleRooms = getCompatibleRooms(task, rooms);
            if (compatibleRooms.length === 0) continue;

            for (const room of compatibleRooms) {
                const streamId = normalizeTimetableId(task.streamId);
                const periodId = normalizeTimetableId(period.id);
                const teacherId = normalizeTimetableId(task.teacherId);

                // Check hard constraints only (Stream, Teacher, Room)
                const streamKey = `${streamId}__${periodId}`;
                const teacherKey = teacherId ? `${teacherId}__${periodId}` : null;
                const roomKey = room && room.id ? `${normalizeTimetableId(room.id)}__${periodId}` : null;

                const isStreamBusy = indexes.streamPeriod.has(streamKey);
                const isTeacherBusy = teacherKey ? indexes.teacherPeriod.has(teacherKey) : false;
                const isRoomBusy = roomKey ? indexes.roomPeriod.has(roomKey) : false;

                if (!isStreamBusy && !isTeacherBusy && !isRoomBusy) {
                    console.log("✅ SINGLE SLOT FOUND (VIA CONSTRAINT RELAXATION)", {
                        taskId: task.taskId,
                        periodId: period.id
                    });
                    return { period, room };
                }
            }
        }
    }

    console.error("❌ FAILED TO FIND SINGLE LESSON SLOT", {
        taskId: task.taskId,
        streamId: task.streamId,
        subjectId: task.subjectId,
        teacherId: task.teacherId,
        attempts,
        streamConflicts,
        teacherConflicts,
        roomConflicts,
        dailyLimitConflicts
    });

    return null;
}


/**
 * Enhanced Double Lesson Slot Finder with Fallback & Diagnostic Logging
 */
function findDoubleLessonSlot(
    task,
    periods,
    rooms,
    indexes
) {
    const orderedPeriods = sortTimetablePeriods(periods);
    const periodsByDay = groupPeriodsByDay(orderedPeriods);
    const dayKeys = Object.keys(periodsByDay || {});
    const days = shuffleArray(dayKeys);

    let consecutivePairs = 0;
    let streamConflicts = 0;
    let teacherConflicts = 0;
    let roomConflicts = 0;
    let dailyLimitConflicts = 0;

    // --------------------------------------------------------
    // PASS 1: Standard Consecutive Pair Check with Daily Limits
    // --------------------------------------------------------
    for (const day of days) {
        const dayPeriods = sortTimetablePeriods(periodsByDay[day]);
        if (dayPeriods.length < 2) continue;

        for (let i = 0; i < dayPeriods.length - 1; i++) {
            const firstPeriod = dayPeriods[i];
            const secondPeriod = dayPeriods[i + 1];

            if (!arePeriodsConsecutive(firstPeriod, secondPeriod)) continue;
            consecutivePairs++;

            const maxPerDay = Number(task.maxLessonsPerDay) || 0;
            const currentCount = getDailyStreamLessonCount(indexes, task.streamId, firstPeriod.day_number);

            if (maxPerDay > 0 && currentCount >= maxPerDay) {
                dailyLimitConflicts++;
                continue;
            }

            const compatibleRooms = getCompatibleRooms(task, rooms);
            if (compatibleRooms.length === 0) continue;

            for (const room of compatibleRooms) {
                const firstCheck = checkSingleSlotConflict(task, firstPeriod, room, indexes);
                if (!firstCheck.valid) {
                    if (firstCheck.reason.includes("Stream already")) streamConflicts++;
                    else if (firstCheck.reason.includes("Teacher is already")) teacherConflicts++;
                    else if (firstCheck.reason.includes("Room is already")) roomConflicts++;
                    else if (firstCheck.reason.includes("Maximum lessons")) dailyLimitConflicts++;
                    continue;
                }

                const secondCheck = checkSingleSlotConflict(task, secondPeriod, room, indexes);
                if (!secondCheck.valid) {
                    if (secondCheck.reason.includes("Stream already")) streamConflicts++;
                    else if (secondCheck.reason.includes("Teacher is already")) teacherConflicts++;
                    else if (secondCheck.reason.includes("Room is already")) roomConflicts++;
                    else if (secondCheck.reason.includes("Maximum lessons")) dailyLimitConflicts++;
                    continue;
                }

                return { firstPeriod, secondPeriod, room };
            }
        }
    }

    // --------------------------------------------------------
    // PASS 2: RELAXATION FALLBACK (Double Lesson Daily Limit Override)
    // --------------------------------------------------------
    if (dailyLimitConflicts > 0 && streamConflicts === 0 && teacherConflicts === 0) {
        console.warn("⚠️ Relaxing maxLessonsPerDay for double lesson task to prevent unplaced queue overflow:", {
            taskId: task.taskId,
            streamId: task.streamId
        });

        for (const day of days) {
            const dayPeriods = sortTimetablePeriods(periodsByDay[day]);
            if (dayPeriods.length < 2) continue;

            for (let i = 0; i < dayPeriods.length - 1; i++) {
                const firstPeriod = dayPeriods[i];
                const secondPeriod = dayPeriods[i + 1];

                if (!arePeriodsConsecutive(firstPeriod, secondPeriod)) continue;

                const compatibleRooms = getCompatibleRooms(task, rooms);
                if (compatibleRooms.length === 0) continue;

                for (const room of compatibleRooms) {
                    const streamId = normalizeTimetableId(task.streamId);
                    const teacherId = normalizeTimetableId(task.teacherId);
                    const roomId = room && room.id ? normalizeTimetableId(room.id) : null;

                    const p1Id = normalizeTimetableId(firstPeriod.id);
                    const p2Id = normalizeTimetableId(secondPeriod.id);

                    const isBusy = (pId) => 
                        indexes.streamPeriod.has(`${streamId}__${pId}`) ||
                        (teacherId && indexes.teacherPeriod.has(`${teacherId}__${pId}`)) ||
                        (roomId && indexes.roomPeriod.has(`${roomId}__${pId}`));

                    if (!isBusy(p1Id) && !isBusy(p2Id)) {
                        console.log("✅ DOUBLE SLOT FOUND (VIA CONSTRAINT RELAXATION)", {
                            taskId: task.taskId,
                            day: firstPeriod.day_name
                        });
                        return { firstPeriod, secondPeriod, room };
                    }
                }
            }
        }
    }

    console.error("❌ FAILED TO FIND DOUBLE LESSON SLOT", {
        taskId: task.taskId,
        streamId: task.streamId,
        subjectId: task.subjectId,
        teacherId: task.teacherId,
        consecutivePairs,
        streamConflicts,
        teacherConflicts,
        roomConflicts,
        dailyLimitConflicts
    });

    return null;
}



// ============================================================
// END PART 3 + PART 4
// ============================================================



// ============================================================
// PART 5 — GENERATE TIMETABLE
// ============================================================


// ============================================================
// PATCH & ENHANCEMENT — TIMETABLE GENERATION STATE & INITIALIZER FIX
// ============================================================

/**
 * Ensures initialization checks and state flags are properly validated 
 * before running generation loops, preventing zero-entry silent failures.
 */
function initializeAndVerifyGenerator(tasks, periods, rooms) {
    console.log("🛠️ Verifying timetable generation preconditions...");

    if (!Array.isArray(tasks) || tasks.length === 0) {
        console.error("❌ Generator aborted: No tasks provided for scheduling.");
        return false;
    }

    if (!Array.isArray(periods) || periods.length === 0) {
        console.error("❌ Generator aborted: No periods defined in timetable structure.");
        return false;
    }

    if (!Array.isArray(rooms)) {
        console.warn("⚠️ Rooms parameter is not an array. Defaulting to empty collection.");
    }

    console.log("✅ Preconditions verified successfully.", {
        taskCount: tasks.length,
        periodCount: periods.length,
        roomCount: Array.isArray(rooms) ? rooms.length : 0
    });

    return true;
}





async function generateTimetable() {

    console.log(
        "======================================"
    );

    console.log(
        "🚀 GENERATE TIMETABLE FUNCTION STARTED"
    );

    console.log(
        "School ID:",
        timetableState.schoolId
    );

    console.log(
        "Generation running:",
        timetableGenerationRunning
    );

    console.log(
        "======================================"
    );

    console.log(
        "======================================"
    );

    console.log(
        "🚀 GENERATE TIMETABLE FUNCTION STARTED"
    );

    console.log(
        "School ID:",
        timetableState.schoolId
    );

    console.log(
        "Generation running:",
        timetableGenerationRunning
    );

    console.log(
        "======================================"
    );


    // ========================================================
    // PREVENT DOUBLE GENERATION
    // ========================================================

    if (timetableGenerationRunning) {

        console.warn(
            "TIMETABLE GENERATION ALREADY RUNNING"
        );

        return;

    }


    // ========================================================
    // CHECK SCHOOL
    // ========================================================

    if (!timetableState.schoolId) {

        const message =
            "Please select a school first.";

        console.error(message);

        if (
            typeof setTimetableGenerationStatus ===
            "function"
        ) {

            setTimetableGenerationStatus(
                message,
                "error"
            );

        }

        return;

    }


    // ========================================================
    // START GENERATION
    // ========================================================

    timetableGenerationRunning = true;


    try {

        // ====================================================
        // STEP 1 — SHOW STATUS
        // ====================================================

        if (
            typeof setTimetableGenerationStatus ===
            "function"
        ) {

            setTimetableGenerationStatus(
                "Loading timetable generator data...",
                "info"
            );

        }


        console.log(
            "STEP 1: Loading generator data..."
        );


        // ====================================================
        // STEP 2 — LOAD DATA
        // ====================================================

        const data =
            await loadTimetableGeneratorData();


        console.log(
            "STEP 2: Generator data loaded."
        );


        console.log(
            "Requirements:",
            data.requirements.length
        );

        console.log(
            "Periods:",
            data.periods.length
        );

        console.log(
            "Streams:",
            data.streams.length
        );

        console.log(
            "Subjects:",
            data.subjects.length
        );

        console.log(
            "Teachers:",
            data.teachers.length
        );

        console.log(
            "Rooms:",
            data.rooms.length
        );


        // ====================================================
        // STEP 3 — VALIDATE DATA
        // ====================================================

        validateTimetableGeneratorData(
            data
        );


        console.log(
            "STEP 3: Generator data validated."
        );


        // ====================================================
        // STEP 4 — BUILD LOOKUPS
        // ====================================================

        const lookup =
            buildTimetableLookupMaps(
                data
            );


        console.log(
            "STEP 4: Lookup maps created."
        );


        // ====================================================
        // STEP 5 — GET TEACHING PERIODS
        // ====================================================

        const teachingPeriods =
            getTeachingPeriods(
                data.periods
            );


        console.log(
            "STEP 5: Teaching periods:",
            teachingPeriods.length
        );


        if (
            teachingPeriods.length === 0
        ) {

            throw new Error(
                "No teaching periods are available."
            );

        }


        // ====================================================
        // SHOW PERIOD INFORMATION
        // ====================================================

        console.table(

            teachingPeriods.map(
                period => ({

                    id:
                        period.id,

                    day:
                        period.day_name,

                    dayNumber:
                        period.day_number,

                    order:
                        period.period_order,

                    number:
                        period.period_number,

                    start:
                        period.start_time,

                    end:
                        period.end_time,

                    teaching:
                        period.is_teaching_period,

                    type:
                        period.period_type

                })
            )

        );


        // ====================================================
        // STEP 6 — CREATE LESSON TASKS
        // ====================================================

        let tasks =
            createLessonTasks(
                data.requirements,
                lookup
            );


        console.log(
            "STEP 6: Lesson tasks created:",
            tasks.length
        );


        if (
            tasks.length === 0
        ) {

            throw new Error(
                "No lesson tasks could be created from the timetable requirements."
            );

        }


        // ====================================================
        // STEP 7 — SHUFFLE TASKS
        // ====================================================

        tasks =
            shuffleArray(
                tasks
            );


        // ====================================================
        // DOUBLE LESSONS FIRST
        // ====================================================

        tasks.sort(
            (
                a,
                b
            ) => {

                if (
                    a.isDouble !==
                    b.isDouble
                ) {

                    return a.isDouble
                        ? -1
                        : 1;

                }

                return 0;

            }
        );


        console.log(
            "STEP 7: Tasks ordered."
        );


        console.log(
            "Total tasks:",
            tasks.length
        );


        // ====================================================
        // TASK SUMMARY
        // ====================================================

        console.table(

            tasks.map(
                task => ({

                    taskId:
                        task.taskId,

                    streamId:
                        task.streamId,

                    subjectId:
                        task.subjectId,

                    teacherId:
                        task.teacherId,

                    double:
                        task.isDouble,

                    periods:
                        task.lessonsRequired

                })
            )

        );


        // ====================================================
        // STEP 8 — CREATE OCCUPANCY INDEXES
        // ====================================================

        const indexes =
            createOccupancyIndexes();


        console.log(
            "STEP 8: Occupancy indexes created."
        );


        // ====================================================
        // STEP 9 — GENERATE ENTRIES
        // ====================================================

        const entries = [];

        const conflicts = [];


        console.log(
            "STEP 9: Starting lesson placement..."
        );


        // ====================================================
        // PLACE EACH TASK
        // ====================================================

        for (
            let i = 0;
            i < tasks.length;
            i++
        ) {

            const task =
                tasks[i];


            console.log(
                `PLACING TASK ${i + 1}/${tasks.length}`,
                task.taskId
            );


            // =================================================
            // DOUBLE LESSON
            // =================================================

            if (
                task.isDouble
            ) {

                const slot =
                    findDoubleLessonSlot(
                        task,
                        teachingPeriods,
                        data.rooms,
                        indexes
                    );


                // ------------------------------------------------
                // DOUBLE LESSON FAILED
                // ------------------------------------------------

                if (
                    !slot
                ) {

                    console.warn(
                        "DOUBLE LESSON COULD NOT BE PLACED:",
                        task.taskId
                    );


                    conflicts.push({

                        taskId:
                            task.taskId,

                        requirementId:
                            task.requirementId,

                        streamId:
                            task.streamId,

                        subjectId:
                            task.subjectId,

                        teacherId:
                            task.teacherId,

                        reason:
                            "No two consecutive free periods were available."

                    });


                }


                // ------------------------------------------------
                // DOUBLE LESSON FOUND
                // ------------------------------------------------

                else {

                    // ---------------------------------------------
                    // RESERVE FIRST PERIOD
                    // ---------------------------------------------

                    reserveSlot(
                        task,
                        slot.firstPeriod,
                        slot.room,
                        indexes
                    );


                    // ---------------------------------------------
                    // RESERVE SECOND PERIOD
                    // ---------------------------------------------

                    reserveSlot(
                        task,
                        slot.secondPeriod,
                        slot.room,
                        indexes
                    );


                    // ---------------------------------------------
                    // CREATE FIRST ENTRY
                    // ---------------------------------------------

                    entries.push(

                        createGeneratedEntry(
                            task,
                            slot.firstPeriod,
                            slot.room
                        )

                    );


                    // ---------------------------------------------
                    // CREATE SECOND ENTRY
                    // ---------------------------------------------

                    entries.push(

                        createGeneratedEntry(
                            task,
                            slot.secondPeriod,
                            slot.room
                        )

                    );


                    console.log(
                        "✅ DOUBLE LESSON PLACED:",
                        task.taskId
                    );

                }

            }


            // =================================================
            // SINGLE LESSON
            // =================================================

            else {

                const slot =
                    findSingleLessonSlot(
                        task,
                        teachingPeriods,
                        data.rooms,
                        indexes
                    );


                // ------------------------------------------------
                // SINGLE LESSON FAILED
                // ------------------------------------------------

                if (
                    !slot
                ) {

                    console.warn(
                        "SINGLE LESSON COULD NOT BE PLACED:",
                        task.taskId
                    );


                    conflicts.push({

                        taskId:
                            task.taskId,

                        requirementId:
                            task.requirementId,

                        streamId:
                            task.streamId,

                        subjectId:
                            task.subjectId,

                        teacherId:
                            task.teacherId,

                        reason:
                            "No free period, teacher slot, room, or daily slot was available."

                    });

                }


                // ------------------------------------------------
                // SINGLE LESSON FOUND
                // ------------------------------------------------

                else {

                    reserveSlot(
                        task,
                        slot.period,
                        slot.room,
                        indexes
                    );


                    entries.push(

                        createGeneratedEntry(
                            task,
                            slot.period,
                            slot.room
                        )

                    );


                    console.log(
                        "✅ SINGLE LESSON PLACED:",
                        task.taskId
                    );

                }

            }


            // =================================================
            // UPDATE STATUS
            // =================================================

            if (
                typeof setTimetableGenerationStatus ===
                "function"
            ) {

                setTimetableGenerationStatus(

                    `Generating timetable... ${i + 1} / ${tasks.length}`,

                    "info"

                );

            }

        }


        // ====================================================
        // STEP 10 — GENERATION RESULT
        // ====================================================

        console.log(
            "======================================"
        );

        console.log(
            "GENERATION COMPLETE"
        );

        console.log(
            "Total tasks:",
            tasks.length
        );

        console.log(
            "Generated entries:",
            entries.length
        );

        console.log(
            "Conflicts:",
            conflicts.length
        );

        console.log(
            "======================================"
        );


        // ====================================================
        // SHOW GENERATED ENTRIES
        // ====================================================

        console.table(
            entries
        );


        // ====================================================
        // SHOW CONFLICTS
        // ====================================================

        console.table(
            conflicts
        );


        // ====================================================
        // DO NOT SAVE EMPTY TIMETABLE
        // ====================================================

        if (
            entries.length === 0
        ) {

            if (
                typeof showTimetableConflicts ===
                "function"
            ) {

                showTimetableConflicts(
                    conflicts,
                    lookup
                );

            }


            throw new Error(

                "No timetable entries could be generated. " +

                conflicts.length +

                " lesson task(s) could not be placed."

            );

        }


        // ====================================================
        // STEP 11 — CLEAR OLD TIMETABLE
        // ====================================================

        if (
            typeof setTimetableGenerationStatus ===
            "function"
        ) {

            setTimetableGenerationStatus(

                "Clearing previous timetable...",

                "info"

            );

        }


        console.log(
            "STEP 11: Clearing old timetable..."
        );


        const {
            error: deleteError
        } = await supabaseClient

            .from(
                "timetable_entries"
            )

            .delete()

            .eq(
                "school_id",
                timetableState.schoolId
            );


        if (
            deleteError
        ) {

            console.error(
                "DELETE ERROR:",
                deleteError
            );


            throw new Error(

                "Failed to clear previous timetable: " +

                deleteError.message

            );

        }


        console.log(
            "Old timetable cleared."
        );


        // ====================================================
        // STEP 12 — SAVE NEW TIMETABLE
        // ====================================================

        if (
            typeof setTimetableGenerationStatus ===
            "function"
        ) {

            setTimetableGenerationStatus(

                `Saving ${entries.length} timetable entries...`,

                "info"

            );

        }


        console.log(
            "STEP 12: Saving generated entries..."
        );


        const {
            data: insertedEntries,
            error: insertError
        } = await supabaseClient

            .from(
                "timetable_entries"
            )

            .insert(
                entries
            )

            .select();


        if (
            insertError
        ) {

            console.error(
                "SUPABASE INSERT ERROR:",
                insertError
            );


            throw new Error(

                "Failed to save timetable: " +

                insertError.message

            );

        }


        // ====================================================
        // STEP 13 — STORE GENERATED ENTRIES
        // ====================================================

        generatedTimetableEntries =
            insertedEntries || entries;


        console.log(
            "STEP 13: Timetable saved."
        );


        console.log(
            "Saved entries:",
            generatedTimetableEntries.length
        );


        console.table(
            generatedTimetableEntries
        );


        // ====================================================
        // STEP 14 — SHOW CONFLICTS
        // ====================================================

       if (
    entries.length === 0
) {

    console.error(
        "======================================"
    );

    console.error(
        "NO TIMETABLE ENTRIES GENERATED"
    );

    console.error(
        "======================================"
    );

    console.error(
        "Total tasks:",
        tasks.length
    );

    console.error(
        "Total conflicts:",
        conflicts.length
    );

    console.table(
        conflicts.map(
            conflict => ({
                taskId:
                    conflict.task?.taskId,

                streamId:
                    conflict.task?.streamId,

                subjectId:
                    conflict.task?.subjectId,

                teacherId:
                    conflict.task?.teacherId,

                isDouble:
                    conflict.task?.isDouble,

                lessonsRequired:
                    conflict.task?.lessonsRequired,

                requiresRoom:
                    conflict.task?.requiresRoom,

                roomType:
                    conflict.task?.roomType,

                maxLessonsPerDay:
                    conflict.task?.maxLessonsPerDay,

                reason:
                    conflict.reason
            })
        )
    );

    console.error(
        "Teaching periods available:",
        teachingPeriods.length
    );

    console.table(
        teachingPeriods.map(
            period => ({
                id:
                    period.id,

                day:
                    period.day_name,

                dayNumber:
                    period.day_number,

                order:
                    period.period_order,

                number:
                    period.period_number,

                start:
                    period.start_time,

                end:
                    period.end_time,

                teaching:
                    period.is_teaching_period,

                type:
                    period.period_type
            })
        )
    );

    console.error(
        "Rooms available:",
        data.rooms.length
    );

    console.table(
        data.rooms.map(
            room => ({
                id:
                    room.id,

                name:
                    getTimetableRoomName(
                        room
                    ),

                type:
                    getTimetableRoomType(
                        room
                    )
            })
        )
    );

    showTimetableConflicts(
        conflicts,
        lookup
    );

    throw new Error(
        "No timetable entries could be generated. " +
        conflicts.length +
        " lesson task(s) could not be placed."
    );

}
        


        // ====================================================
        // STEP 15 — SHOW SUMMARY
        // ====================================================

        if (
            typeof showTimetableSummary ===
            "function"
        ) {

            showTimetableSummary(

                tasks.length,

                generatedTimetableEntries.length,

                conflicts.length

            );

        }


        // ====================================================
        // STEP 16 — LOAD GENERATED TIMETABLE
        // ====================================================

        if (
            typeof loadGeneratedTimetable ===
            "function"
        ) {

            console.log(
                "STEP 16: Loading generated timetable..."
            );


            await loadGeneratedTimetable();

        }



        if (
            typeof setTimetableGenerationStatus ===
            "function"
        ) {

            if (
                conflicts.length === 0
            ) {

                setTimetableGenerationStatus(

                    `Timetable generated successfully. ${generatedTimetableEntries.length} lesson periods saved.`,

                    "success"

                );

            }

            else {

                setTimetableGenerationStatus(

                    `Timetable generated with ${conflicts.length} unresolved lesson task(s). ${generatedTimetableEntries.length} lesson periods saved.`,

                    "warning"

                );

            }

        }


        // ====================================================
        // FINAL LOG
        // ====================================================

        console.log(
            "======================================"
        );

        console.log(
            "✅ SMART TIMETABLE GENERATION SUCCESS"
        );

        console.log(
            "Entries:",
            generatedTimetableEntries.length
        );

        console.log(
            "Conflicts:",
            conflicts.length
        );

        console.log(
            "======================================"
        );


        // ====================================================
        // RETURN RESULT
        // ====================================================

        return {

            entries:
                generatedTimetableEntries,

            conflicts:
                conflicts,

            tasks:
                tasks

        };

    }


    // ========================================================
    // ERROR HANDLER
    // ========================================================

    catch (error) {

        console.error(
            "======================================"
        );

        console.error(
            "❌ TIMETABLE GENERATION ERROR"
        );

        console.error(
            error
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Stack:",
            error.stack
        );

        console.error(
            "======================================"
        );


        if (
            typeof setTimetableGenerationStatus ===
            "function"
        ) {

            setTimetableGenerationStatus(

                "Timetable generation failed: " +
                error.message,

                "error"

            );

        }


        return {

            entries: [],

            conflicts: [],

            error: error

        };

    }


    // ========================================================
    // FINALLY
    // ========================================================

    finally {

        timetableGenerationRunning =
            false;


        console.log(
            "Generation running reset to false."
        );

    }

}




// ============================================================
// PART 5 — LOAD AND DISPLAY GENERATED TIMETABLE
// ============================================================

// ------------------------------------------------------------
// LOAD GENERATED TIMETABLE
// ------------------------------------------------------------

async function loadGeneratedTimetable() {

    console.log(
        "======================================"
    );

    console.log(
        "LOADING GENERATED TIMETABLE"
    );

    console.log(
        "School ID:",
        timetableState.schoolId
    );

    console.log(
        "======================================"
    );


    const container =
        document.getElementById(
            "timetableContent"
        );


    if (!container) {

        console.warn(
            "timetableContent element not found."
        );

        return;

    }


    // --------------------------------------------------------
    // CHECK SCHOOL
    // --------------------------------------------------------

    if (
        !timetableState ||
        !timetableState.schoolId
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <div>🏫</div>

                <h3>
                    Please select a school first.
                </h3>

            </div>
        `;

        generatedTimetableEntries = [];

        return;

    }


    // --------------------------------------------------------
    // LOADING MESSAGE
    // --------------------------------------------------------

    container.innerHTML = `
        <div class="loading-message">
            Loading generated timetable...
        </div>
    `;


    try {

        // ====================================================
        // 1. LOAD TIMETABLE ENTRIES
        // ====================================================

        const entriesResult =
            await supabaseClient

                .from(
                    "timetable_entries"
                )

                .select("*")

                .eq(
                    "school_id",
                    timetableState.schoolId
                );


        if (
            entriesResult.error
        ) {

            throw new Error(
                "Failed to load timetable entries: " +
                entriesResult.error.message
            );

        }


        const entries =
            entriesResult.data || [];


        console.log(
            "Generated timetable entries:",
            entries.length
        );


        // ----------------------------------------------------
        // NO ENTRIES
        // ----------------------------------------------------

        if (
            entries.length === 0
        ) {

            generatedTimetableEntries = [];

            container.innerHTML = `
                <div class="empty-state">

                    <div>📅</div>

                    <h3>
                        No timetable generated yet
                    </h3>

                    <p>
                        Click
                        <strong>
                            Generate Timetable
                        </strong>
                        to create one.
                    </p>

                </div>
            `;

            return;

        }


        // ====================================================
        // 2. LOAD PERIODS
        // ====================================================

        const periodsResult =
            await supabaseClient

                .from(
                    "timetable_periods"
                )

                .select("*")

                .eq(
                    "school_id",
                    timetableState.schoolId
                );


        if (
            periodsResult.error
        ) {

            throw new Error(
                "Failed to load timetable periods: " +
                periodsResult.error.message
            );

        }


        // ====================================================
        // 3. LOAD STREAMS
        // ====================================================

        const streamsResult =
            await supabaseClient

                .from(
                    "timetable_streams"
                )

                .select("*")

                .eq(
                    "school_id",
                    timetableState.schoolId
                );


        if (
            streamsResult.error
        ) {

            throw new Error(
                "Failed to load timetable streams: " +
                streamsResult.error.message
            );

        }


        // ====================================================
        // 4. LOAD SUBJECTS
        // ====================================================

        const subjectsResult =
            await supabaseClient

                .from(
                    "timetable_subjects"
                )

                .select("*")

                .eq(
                    "school_id",
                    timetableState.schoolId
                );


        if (
            subjectsResult.error
        ) {

            throw new Error(
                "Failed to load timetable subjects: " +
                subjectsResult.error.message
            );

        }


        // ====================================================
        // 5. LOAD TEACHERS
        // ====================================================

        const teachersResult =
            await supabaseClient

                .from(
                    "timetable_teachers"
                )

                .select("*")

                .eq(
                    "school_id",
                    timetableState.schoolId
                );


        if (
            teachersResult.error
        ) {

            throw new Error(
                "Failed to load timetable teachers: " +
                teachersResult.error.message
            );

        }


        // ====================================================
        // 6. LOAD ROOMS
        // ====================================================

        const roomsResult =
            await supabaseClient

                .from(
                    "timetable_rooms"
                )

                .select("*")

                .eq(
                    "school_id",
                    timetableState.schoolId
                );


        if (
            roomsResult.error
        ) {

            throw new Error(
                "Failed to load timetable rooms: " +
                roomsResult.error.message
            );

        }


        // ====================================================
        // 7. BUILD LOOKUP MAPS
        // ====================================================

        const lookup =
            buildTimetableLookupMaps({

                periods:
                    periodsResult.data || [],

                streams:
                    streamsResult.data || [],

                subjects:
                    subjectsResult.data || [],

                teachers:
                    teachersResult.data || [],

                rooms:
                    roomsResult.data || []

            });


        console.log(
            "Display periods:",
            periodsResult.data?.length || 0
        );

        console.log(
            "Display streams:",
            streamsResult.data?.length || 0
        );

        console.log(
            "Display subjects:",
            subjectsResult.data?.length || 0
        );

        console.log(
            "Display teachers:",
            teachersResult.data?.length || 0
        );

        console.log(
            "Display rooms:",
            roomsResult.data?.length || 0
        );


        // ====================================================
        // 8. SAVE ENTRIES IN GLOBAL STATE
        // ====================================================

        generatedTimetableEntries =
            entries;


        // ====================================================
        // 9. RENDER
        // ====================================================

        renderGeneratedTimetable(
            entries,
            lookup
        );


        console.log(
            "TIMETABLE DISPLAY COMPLETE"
        );


    }
    catch (error) {

        console.error(
            "FAILED TO LOAD GENERATED TIMETABLE:",
            error
        );


        generatedTimetableEntries = [];


        container.innerHTML = `
            <div class="empty-message">

                <h3>
                    Failed to load timetable
                </h3>

                <p>
                    ${escapeHtml(
                        error.message ||
                        "Unknown error"
                    )}
                </p>

            </div>
        `;

    }

}



// ============================================================
// RENDER GENERATED TIMETABLE
// ============================================================

function renderGeneratedTimetable(
    entries,
    lookup
) {

    const container =
        document.getElementById(
            "timetableContent"
        );


    if (!container) {

        console.warn(
            "timetableContent element not found."
        );

        return;

    }


    if (
        !entries ||
        entries.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <div>📅</div>

                <h3>
                    No timetable entries available.
                </h3>

            </div>
        `;

        return;

    }


    console.log(
        "Rendering timetable entries:",
        entries.length
    );


    // ========================================================
    // SORT ENTRIES
    // ========================================================

    const sortedEntries =
        [...entries].sort(
            (
                a,
                b
            ) => {

                const periodA =
                    lookup.periods.get(
                        a.period_id
                    );

                const periodB =
                    lookup.periods.get(
                        b.period_id
                    );


                const dayA =
                    Number(
                        periodA?.day_number || 0
                    );

                const dayB =
                    Number(
                        periodB?.day_number || 0
                    );


                if (
                    dayA !== dayB
                ) {

                    return dayA - dayB;

                }


                const orderA =
                    Number(
                        periodA?.period_order || 0
                    );

                const orderB =
                    Number(
                        periodB?.period_order || 0
                    );


                return (
                    orderA - orderB
                );

            }
        );


    // ========================================================
    // GROUP BY STREAM
    // ========================================================

    const streamGroups =
        new Map();


    sortedEntries.forEach(
        entry => {

            const streamId =
                entry.stream_id;


            if (
                !streamGroups.has(
                    streamId
                )
            ) {

                streamGroups.set(
                    streamId,
                    []
                );

            }


            streamGroups
                .get(streamId)
                .push(entry);

        }
    );


    // ========================================================
    // BUILD HTML
    // ========================================================

    let html = "";


    html += `
        <div class="generated-timetable">

            <div class="timetable-header">

                <h2>
                    📅 Generated Timetable
                </h2>

                <p>
                    ${sortedEntries.length}
                    lesson periods generated.
                </p>

            </div>
    `;


    // ========================================================
    // RENDER EACH STREAM
    // ========================================================

    streamGroups.forEach(
        (
            streamEntries,
            streamId
        ) => {

            const stream =
                lookup.streams.get(
                    streamId
                );


            const streamName =
                getTimetableStreamName(
                    stream
                );


            html += `
                <div class="timetable-stream">

                    <div class="timetable-stream-title">

                        📚
                        ${escapeHtml(
                            streamName
                        )}

                    </div>

                    <div class="timetable-table-wrapper">

                        <table
                            class="timetable-table"
                        >

                            <thead>

                                <tr>

                                    <th>
                                        Day
                                    </th>

                                    <th>
                                        Period
                                    </th>

                                    <th>
                                        Time
                                    </th>

                                    <th>
                                        Subject
                                    </th>

                                    <th>
                                        Teacher
                                    </th>

                                    <th>
                                        Room
                                    </th>

                                </tr>

                            </thead>

                            <tbody>
            `;


            streamEntries.forEach(
                entry => {

                    const period =
                        lookup.periods.get(
                            entry.period_id
                        );


                    const subject =
                        lookup.subjects.get(
                            entry.subject_id
                        );


                    const teacher =
                        lookup.teachers.get(
                            entry.teacher_id
                        );


                    const room =
                        lookup.rooms.get(
                            entry.room_id
                        );


                    const day =
                        period?.day_name ||
                        (
                            period?.day_number
                                ? `Day ${period.day_number}`
                                : "Unknown"
                        );


                    const periodNumber =
                        period?.period_number ||
                        period?.period_order ||
                        "-";


                    const startTime =
                        period?.start_time ||
                        "";


                    const endTime =
                        period?.end_time ||
                        "";


                    const time =
                        startTime &&
                        endTime
                            ? `${startTime} - ${endTime}`
                            : "-";


                    html += `
                        <tr>

                            <td>
                                ${escapeHtml(
                                    String(day)
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(
                                        periodNumber
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(time)
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${escapeHtml(
                                        getTimetableSubjectName(
                                            subject
                                        )
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(
                                    getTimetableTeacherName(
                                        teacher
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    getTimetableRoomName(
                                        room
                                    )
                                )}
                            </td>

                        </tr>
                    `;

                }
            );


            html += `
                            </tbody>

                        </table>

                    </div>

                </div>
            `;

        }
    );


    html += `
        </div>
    `;


    // ========================================================
    // DISPLAY
    // ========================================================

    container.innerHTML =
        html;


    console.log(
        "Timetable rendered successfully."
    );

}
// ============================================================
// PART 6 — RENDER GENERATED TIMETABLE
// ============================================================


// ============================================================
// RENDER BY STREAM
// ============================================================

function renderTimetableByStream(
    entries,
    lookup,
    container
) {

    // --------------------------------------------------------
    // SAFETY CHECK
    // --------------------------------------------------------

    if (!container) {
        console.warn(
            "renderTimetableByStream: container not found."
        );

        return;
    }


    if (!Array.isArray(entries)) {
        console.warn(
            "renderTimetableByStream: entries is not an array."
        );

        container.innerHTML = `
            <div class="empty-message">
                No timetable entries available.
            </div>
        `;

        return;
    }


    // --------------------------------------------------------
    // GROUP ENTRIES BY STREAM
    // --------------------------------------------------------

    const streamMap =
        new Map();


    entries.forEach(
        entry => {

            if (!entry) {
                return;
            }


            const streamId =
                entry.stream_id ||
                "unknown-stream";


            if (
                !streamMap.has(
                    streamId
                )
            ) {

                streamMap.set(
                    streamId,
                    []
                );

            }


            streamMap
                .get(streamId)
                .push(entry);

        }
    );


    // --------------------------------------------------------
    // NOTHING TO RENDER
    // --------------------------------------------------------

    if (
        streamMap.size === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No timetable entries available.
            </div>
        `;

        return;

    }


    let html = "";


    // --------------------------------------------------------
    // RENDER EACH STREAM
    // --------------------------------------------------------

    streamMap.forEach(
        (
            streamEntries,
            streamId
        ) => {

            const stream =
                lookup.streams.get(
                    streamId
                );


            const streamName =
                getTimetableStreamName(
                    stream
                );


            // -----------------------------------------------
            // SORT STREAM ENTRIES
            // -----------------------------------------------

            streamEntries.sort(
                (
                    a,
                    b
                ) => {

                    const periodA =
                        lookup.periods.get(
                            a.period_id
                        );


                    const periodB =
                        lookup.periods.get(
                            b.period_id
                        );


                    const dayDifference =
                        Number(
                            periodA?.day_number || 0
                        ) -
                        Number(
                            periodB?.day_number || 0
                        );


                    if (
                        dayDifference !== 0
                    ) {

                        return dayDifference;

                    }


                    return (
                        Number(
                            periodA?.period_order || 0
                        ) -
                        Number(
                            periodB?.period_order || 0
                        )
                    );

                }
            );


            // -----------------------------------------------
            // STREAM HEADER
            // -----------------------------------------------

            html += `

                <div class="timetable-stream-block">

                    <h3>
                        🏫
                        ${escapeHtml(
                            streamName
                        )}
                    </h3>

                    <div class="table-responsive">

                        <table class="data-table timetable-grid">

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


            // -----------------------------------------------
            // STREAM ENTRIES
            // -----------------------------------------------

            streamEntries.forEach(
                entry => {

                    const period =
                        lookup.periods.get(
                            entry.period_id
                        );


                    const subject =
                        lookup.subjects.get(
                            entry.subject_id
                        );


                    const teacher =
                        entry.teacher_id
                            ? lookup.teachers.get(
                                entry.teacher_id
                            )
                            : null;


                    const room =
                        entry.room_id
                            ? lookup.rooms.get(
                                entry.room_id
                            )
                            : null;


                    const dayName =
                        period?.day_name ||
                        (
                            period?.day_number
                                ? `Day ${period.day_number}`
                                : "-"
                        );


                    const periodNumber =
                        period?.period_number ??
                        period?.period_order ??
                        "-";


                    const time =
                        typeof formatPeriodTime ===
                        "function"
                            ? formatPeriodTime(
                                period
                            )
                            : (
                                period
                                    ? `${period.start_time || ""} - ${period.end_time || ""}`
                                    : "-"
                            );


                    html += `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    String(dayName)
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(
                                        periodNumber
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(time)
                                )}
                            </td>

                            <td>

                                <strong>
                                    ${escapeHtml(
                                        getTimetableSubjectName(
                                            subject
                                        )
                                    )}
                                </strong>

                            </td>

                            <td>
                                ${escapeHtml(
                                    getTimetableTeacherName(
                                        teacher
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    getTimetableRoomName(
                                        room
                                    )
                                )}
                            </td>

                        </tr>

                    `;

                }
            );


            // -----------------------------------------------
            // CLOSE STREAM TABLE
            // -----------------------------------------------

            html += `

                            </tbody>

                        </table>

                    </div>

                </div>

            `;

        }
    );


    // --------------------------------------------------------
    // INSERT HTML
    // --------------------------------------------------------

    container.innerHTML =
        html;

}


// ============================================================
// RENDER BY TEACHER
// ============================================================

function renderTimetableByTeacher(
    entries,
    lookup,
    container
) {

    // --------------------------------------------------------
    // SAFETY CHECK
    // --------------------------------------------------------

    if (!container) {
        console.warn(
            "renderTimetableByTeacher: container not found."
        );

        return;
    }


    if (!Array.isArray(entries)) {

        container.innerHTML = `
            <div class="empty-message">
                No timetable entries available.
            </div>
        `;

        return;

    }


    // --------------------------------------------------------
    // GROUP BY TEACHER
    // --------------------------------------------------------

    const teacherMap =
        new Map();


    entries.forEach(
        entry => {

            if (!entry) {
                return;
            }


            const teacherId =
                entry.teacher_id ||
                "unassigned";


            if (
                !teacherMap.has(
                    teacherId
                )
            ) {

                teacherMap.set(
                    teacherId,
                    []
                );

            }


            teacherMap
                .get(teacherId)
                .push(entry);

        }
    );


    // --------------------------------------------------------
    // NOTHING TO RENDER
    // --------------------------------------------------------

    if (
        teacherMap.size === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No timetable entries available.
            </div>
        `;

        return;

    }


    let html = "";


    // --------------------------------------------------------
    // RENDER EACH TEACHER
    // --------------------------------------------------------

    teacherMap.forEach(
        (
            teacherEntries,
            teacherId
        ) => {

            const teacher =
                lookup.teachers.get(
                    teacherId
                );


            const teacherName =
                getTimetableTeacherName(
                    teacher
                );


            // -----------------------------------------------
            // SORT
            // -----------------------------------------------

            teacherEntries.sort(
                (
                    a,
                    b
                ) => {

                    const periodA =
                        lookup.periods.get(
                            a.period_id
                        );


                    const periodB =
                        lookup.periods.get(
                            b.period_id
                        );


                    const dayDifference =
                        Number(
                            periodA?.day_number || 0
                        ) -
                        Number(
                            periodB?.day_number || 0
                        );


                    if (
                        dayDifference !== 0
                    ) {

                        return dayDifference;

                    }


                    return (
                        Number(
                            periodA?.period_order || 0
                        ) -
                        Number(
                            periodB?.period_order || 0
                        )
                    );

                }
            );


            // -----------------------------------------------
            // TEACHER HEADER
            // -----------------------------------------------

            html += `

                <div class="timetable-stream-block">

                    <h3>
                        👨‍🏫
                        ${escapeHtml(
                            teacherName
                        )}
                    </h3>

                    <div class="table-responsive">

                        <table class="data-table">

                            <thead>

                                <tr>

                                    <th>Day</th>

                                    <th>Period</th>

                                    <th>Time</th>

                                    <th>Stream</th>

                                    <th>Subject</th>

                                    <th>Room</th>

                                </tr>

                            </thead>

                            <tbody>

            `;


            // -----------------------------------------------
            // TEACHER ENTRIES
            // -----------------------------------------------

            teacherEntries.forEach(
                entry => {

                    const period =
                        lookup.periods.get(
                            entry.period_id
                        );


                    const stream =
                        lookup.streams.get(
                            entry.stream_id
                        );


                    const subject =
                        lookup.subjects.get(
                            entry.subject_id
                        );


                    const room =
                        entry.room_id
                            ? lookup.rooms.get(
                                entry.room_id
                            )
                            : null;


                    const dayName =
                        period?.day_name ||
                        (
                            period?.day_number
                                ? `Day ${period.day_number}`
                                : "-"
                        );


                    const periodNumber =
                        period?.period_number ??
                        period?.period_order ??
                        "-";


                    const time =
                        typeof formatPeriodTime ===
                        "function"
                            ? formatPeriodTime(
                                period
                            )
                            : (
                                period
                                    ? `${period.start_time || ""} - ${period.end_time || ""}`
                                    : "-"
                            );


                    html += `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    String(dayName)
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(
                                        periodNumber
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(time)
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    getTimetableStreamName(
                                        stream
                                    )
                                )}
                            </td>

                            <td>

                                <strong>
                                    ${escapeHtml(
                                        getTimetableSubjectName(
                                            subject
                                        )
                                    )}
                                </strong>

                            </td>

                            <td>
                                ${escapeHtml(
                                    getTimetableRoomName(
                                        room
                                    )
                                )}
                            </td>

                        </tr>

                    `;

                }
            );


            // -----------------------------------------------
            // CLOSE TABLE
            // -----------------------------------------------

            html += `

                            </tbody>

                        </table>

                    </div>

                </div>

            `;

        }
    );


    // --------------------------------------------------------
    // INSERT HTML
    // --------------------------------------------------------

    container.innerHTML =
        html;

}


// ============================================================
// RENDER BY ROOM
// ============================================================

function renderTimetableByRoom(
    entries,
    lookup,
    container
) {

    // --------------------------------------------------------
    // SAFETY CHECK
    // --------------------------------------------------------

    if (!container) {

        console.warn(
            "renderTimetableByRoom: container not found."
        );

        return;

    }


    if (!Array.isArray(entries)) {

        container.innerHTML = `
            <div class="empty-message">
                No timetable entries available.
            </div>
        `;

        return;

    }


    // --------------------------------------------------------
    // GROUP BY ROOM
    // --------------------------------------------------------

    const roomMap =
        new Map();


    entries.forEach(
        entry => {

            if (!entry) {
                return;
            }


            const roomId =
                entry.room_id ||
                "no-room";


            if (
                !roomMap.has(
                    roomId
                )
            ) {

                roomMap.set(
                    roomId,
                    []
                );

            }


            roomMap
                .get(roomId)
                .push(entry);

        }
    );


    // --------------------------------------------------------
    // NOTHING TO RENDER
    // --------------------------------------------------------

    if (
        roomMap.size === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No timetable entries available.
            </div>
        `;

        return;

    }


    let html = "";


    // --------------------------------------------------------
    // RENDER EACH ROOM
    // --------------------------------------------------------

    roomMap.forEach(
        (
            roomEntries,
            roomId
        ) => {

            const room =
                lookup.rooms.get(
                    roomId
                );


            const roomName =
                getTimetableRoomName(
                    room
                );


            // -----------------------------------------------
            // SORT
            // -----------------------------------------------

            roomEntries.sort(
                (
                    a,
                    b
                ) => {

                    const periodA =
                        lookup.periods.get(
                            a.period_id
                        );


                    const periodB =
                        lookup.periods.get(
                            b.period_id
                        );


                    const dayDifference =
                        Number(
                            periodA?.day_number || 0
                        ) -
                        Number(
                            periodB?.day_number || 0
                        );


                    if (
                        dayDifference !== 0
                    ) {

                        return dayDifference;

                    }


                    return (
                        Number(
                            periodA?.period_order || 0
                        ) -
                        Number(
                            periodB?.period_order || 0
                        )
                    );

                }
            );


            // -----------------------------------------------
            // ROOM HEADER
            // -----------------------------------------------

            html += `

                <div class="timetable-stream-block">

                    <h3>
                        🚪
                        ${escapeHtml(
                            roomName
                        )}
                    </h3>

                    <div class="table-responsive">

                        <table class="data-table">

                            <thead>

                                <tr>

                                    <th>Day</th>

                                    <th>Period</th>

                                    <th>Time</th>

                                    <th>Stream</th>

                                    <th>Subject</th>

                                    <th>Teacher</th>

                                </tr>

                            </thead>

                            <tbody>

            `;


            // -----------------------------------------------
            // ROOM ENTRIES
            // -----------------------------------------------

            roomEntries.forEach(
                entry => {

                    const period =
                        lookup.periods.get(
                            entry.period_id
                        );


                    const stream =
                        lookup.streams.get(
                            entry.stream_id
                        );


                    const subject =
                        lookup.subjects.get(
                            entry.subject_id
                        );


                    const teacher =
                        entry.teacher_id
                            ? lookup.teachers.get(
                                entry.teacher_id
                            )
                            : null;


                    const dayName =
                        period?.day_name ||
                        (
                            period?.day_number
                                ? `Day ${period.day_number}`
                                : "-"
                        );


                    const periodNumber =
                        period?.period_number ??
                        period?.period_order ??
                        "-";


                    const time =
                        typeof formatPeriodTime ===
                        "function"
                            ? formatPeriodTime(
                                period
                            )
                            : (
                                period
                                    ? `${period.start_time || ""} - ${period.end_time || ""}`
                                    : "-"
                            );


                    html += `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    String(dayName)
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(
                                        periodNumber
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(time)
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    getTimetableStreamName(
                                        stream
                                    )
                                )}
                            </td>

                            <td>

                                <strong>
                                    ${escapeHtml(
                                        getTimetableSubjectName(
                                            subject
                                        )
                                    )}
                                </strong>

                            </td>

                            <td>
                                ${escapeHtml(
                                    getTimetableTeacherName(
                                        teacher
                                    )
                                )}
                            </td>

                        </tr>

                    `;

                }
            );


            // -----------------------------------------------
            // CLOSE TABLE
            // -----------------------------------------------

            html += `

                            </tbody>

                        </table>

                    </div>

                </div>

            `;

        }
    );


    // --------------------------------------------------------
    // INSERT HTML
    // --------------------------------------------------------

    container.innerHTML =
        html;

}


// ============================================================
// END PART 6
// ============================================================
// ============================================================
// PART 7 — FILTERS, SUMMARY, CONFLICTS, CLEAR & REGENERATE
// ============================================================


// ============================================================
// FORMAT PERIOD TIME
// ============================================================

function formatPeriodTime(
    period
) {

    if (!period) {

        return "-";

    }


    const start =
        period.start_time ||
        "";


    const end =
        period.end_time ||
        "";


    if (
        start &&
        end
    ) {

        return `${start} - ${end}`;

    }


    return (
        start ||
        end ||
        "-"
    );

}


// ============================================================
// LOAD TIMETABLE FILTERS
// ============================================================

async function loadTimetableFilters(
    data = null
) {

    try {

        // ----------------------------------------------------
        // LOAD DATA IF NOT PROVIDED
        // ----------------------------------------------------

        if (!data) {

            data =
                await loadTimetableGeneratorData();

        }


        if (!data) {

            console.warn(
                "No timetable data available for filters."
            );

            return;

        }


        // ====================================================
        // STREAM FILTER
        // ====================================================

        if (
            timetableStreamFilter
        ) {

            const currentValue =
                timetableStreamFilter.value;


            let html = `

                <option value="">
                    All Streams
                </option>

            `;


            const streams =
                Array.isArray(
                    data.streams
                )
                    ? [...data.streams]
                    : [];


            // ------------------------------------------------
            // SORT STREAMS
            // ------------------------------------------------

            streams.sort(
                (
                    a,
                    b
                ) => {

                    return getTimetableStreamName(
                        a
                    ).localeCompare(
                        getTimetableStreamName(
                            b
                        )
                    );

                }
            );


            // ------------------------------------------------
            // CREATE OPTIONS
            // ------------------------------------------------

            streams.forEach(
                stream => {

                    if (!stream) {
                        return;
                    }


                    html += `

                        <option
                            value="${escapeHtml(
                                String(
                                    stream.id
                                )
                            )}"
                        >

                            ${escapeHtml(
                                getTimetableStreamName(
                                    stream
                                )
                            )}

                        </option>

                    `;

                }
            );


            timetableStreamFilter.innerHTML =
                html;


            // ------------------------------------------------
            // RESTORE PREVIOUS VALUE
            // ------------------------------------------------

            if (
                currentValue &&
                streams.some(
                    stream =>
                        String(
                            stream.id
                        ) ===
                        String(
                            currentValue
                        )
                )
            ) {

                timetableStreamFilter.value =
                    currentValue;

            }

        }


        // ====================================================
        // DAY FILTER
        // ====================================================

        if (
            timetableDayFilter
        ) {

            const currentDay =
                timetableDayFilter.value;


            let html = `

                <option value="">
                    All Days
                </option>

            `;


            // ------------------------------------------------
            // GET UNIQUE DAYS
            // ------------------------------------------------

            const daysMap =
                new Map();


            const periods =
                Array.isArray(
                    data.periods
                )
                    ? data.periods
                    : [];


            periods.forEach(
                period => {

                    if (!period) {
                        return;
                    }


                    const dayName =
                        period.day_name;


                    if (!dayName) {
                        return;
                    }


                    const dayNumber =
                        Number(
                            period.day_number
                        ) || 0;


                    if (
                        !daysMap.has(
                            dayName
                        )
                    ) {

                        daysMap.set(
                            dayName,
                            dayNumber
                        );

                    }

                }
            );


            // ------------------------------------------------
            // SORT DAYS
            // ------------------------------------------------

            const days =
                Array.from(
                    daysMap.entries()
                );


            days.sort(
                (
                    a,
                    b
                ) => {

                    return (
                        Number(a[1]) -
                        Number(b[1])
                    );

                }
            );


            // ------------------------------------------------
            // CREATE DAY OPTIONS
            // ------------------------------------------------

            days.forEach(
                (
                    [dayName, dayNumber]
                ) => {

                    html += `

                        <option
                            value="${escapeHtml(
                                String(
                                    dayName
                                )
                            )}"
                        >

                            ${escapeHtml(
                                String(
                                    dayName
                                )
                            )}

                        </option>

                    `;

                }
            );


            timetableDayFilter.innerHTML =
                html;


            // ------------------------------------------------
            // RESTORE PREVIOUS DAY
            // ------------------------------------------------

            if (
                currentDay &&
                days.some(
                    item =>
                        String(
                            item[0]
                        ) ===
                        String(
                            currentDay
                        )
                )
            ) {

                timetableDayFilter.value =
                    currentDay;

            }

        }


        // ====================================================
        // VIEW MODE
        // ====================================================

        if (
            timetableViewMode
        ) {

            // Keep existing selection.
            // If empty, default to stream.

            if (
                !timetableViewMode.value
            ) {

                timetableViewMode.value =
                    "stream";

            }

        }


        console.log(
            "Timetable filters loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Failed to load timetable filters:",
            error
        );

    }

}


// ============================================================
// SHOW TIMETABLE SUMMARY
// ============================================================

function showTimetableSummary(
    totalTasks,
    generatedEntries,
    conflictCount
) {

    const summary =
        document.getElementById(
            "timetableSummary"
        );


    const content =
        document.getElementById(
            "timetableSummaryContent"
        );


    if (
        !summary ||
        !content
    ) {

        console.warn(
            "Timetable summary elements not found."
        );

        return;

    }


    // --------------------------------------------------------
    // NORMALIZE VALUES
    // --------------------------------------------------------

    const tasks =
        Number(
            totalTasks
        ) || 0;


    const entries =
        Number(
            generatedEntries
        ) || 0;


    const conflicts =
        Number(
            conflictCount
        ) || 0;


    // --------------------------------------------------------
    // SHOW SUMMARY
    // --------------------------------------------------------

    summary.style.display =
        "block";


    content.innerHTML = `

        <div class="summary-item">

            <strong>
                Requirements
            </strong>

            <span>
                ${tasks}
            </span>

        </div>


        <div class="summary-item">

            <strong>
                Generated Periods
            </strong>

            <span>
                ${entries}
            </span>

        </div>


        <div class="summary-item">

            <strong>
                Conflicts
            </strong>

            <span>
                ${conflicts}
            </span>

        </div>

    `;

}


// ============================================================
// SHOW TIMETABLE CONFLICTS
// ============================================================

function showTimetableConflicts(
    conflicts,
    lookup
) {

    const container =
        document.getElementById(
            "timetableConflicts"
        );


    const content =
        document.getElementById(
            "timetableConflictsContent"
        );


    if (
        !container ||
        !content
    ) {

        console.warn(
            "Timetable conflict elements not found."
        );

        return;

    }


    // --------------------------------------------------------
    // NO CONFLICTS
    // --------------------------------------------------------

    if (
        !Array.isArray(conflicts) ||
        conflicts.length === 0
    ) {

        container.style.display =
            "none";


        content.innerHTML =
            "";


        return;

    }


    // --------------------------------------------------------
    // SHOW CONFLICTS
    // --------------------------------------------------------

    container.style.display =
        "block";


    let html = `

        <div class="empty-message">

            <strong>
                ${conflicts.length}
                lesson task(s) could not be placed.
            </strong>

        </div>


        <div class="table-responsive">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>Stream</th>

                        <th>Subject</th>

                        <th>Teacher</th>

                        <th>Lesson Type</th>

                        <th>Reason</th>

                    </tr>

                </thead>

                <tbody>

    `;


    // --------------------------------------------------------
    // RENDER EACH CONFLICT
    // --------------------------------------------------------

    conflicts.forEach(
        conflict => {

            if (!conflict) {
                return;
            }


            // ------------------------------------------------
            // SUPPORT BOTH CONFLICT FORMATS
            // ------------------------------------------------
            //
            // Part 5 creates:
            //
            // conflict.streamId
            // conflict.subjectId
            // conflict.teacherId
            //
            // Older code may create:
            //
            // conflict.task.streamId
            //
            // We support both.
            // ------------------------------------------------

            const task =
                conflict.task ||
                null;


            const streamId =
                conflict.streamId ||
                task?.streamId ||
                null;


            const subjectId =
                conflict.subjectId ||
                task?.subjectId ||
                null;


            const teacherId =
                conflict.teacherId ||
                task?.teacherId ||
                null;


            const stream =
                lookup?.streams?.get(
                    streamId
                );


            const subject =
                lookup?.subjects?.get(
                    subjectId
                );


            const teacher =
                teacherId
                    ? lookup?.teachers?.get(
                        teacherId
                    )
                    : null;


            // ------------------------------------------------
            // LESSON TYPE
            // ------------------------------------------------

            let lessonType =
                "Single";


            if (
                task &&
                task.isDouble
            ) {

                lessonType =
                    "Double";

            }


            // If Part 5 only provides taskId,
            // detect double from taskId.

            if (
                conflict.taskId &&
                String(
                    conflict.taskId
                ).includes(
                    "-double-"
                )
            ) {

                lessonType =
                    "Double";

            }


            html += `

                <tr>

                    <td>
                        ${escapeHtml(
                            getTimetableStreamName(
                                stream
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            getTimetableSubjectName(
                                subject
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            getTimetableTeacherName(
                                teacher
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            lessonType
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            conflict.reason ||
                            "Unknown conflict"
                        )}
                    </td>

                </tr>

            `;

        }
    );


    // --------------------------------------------------------
    // CLOSE TABLE
    // --------------------------------------------------------

    html += `

                </tbody>

            </table>

        </div>

    `;


    content.innerHTML =
        html;

}


// ============================================================
// CLEAR GENERATED TIMETABLE
// ============================================================

async function clearGeneratedTimetable() {

    // --------------------------------------------------------
    // CHECK SCHOOL
    // --------------------------------------------------------

    if (
        !timetableState.schoolId
    ) {

        setTimetableGenerationStatus(
            "Please select a school first.",
            "error"
        );

        return;

    }


    // --------------------------------------------------------
    // CONFIRM
    // --------------------------------------------------------

    const confirmed =
        confirm(
            "Are you sure you want to clear the generated timetable for this school?"
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        // ----------------------------------------------------
        // STATUS
        // ----------------------------------------------------

        setTimetableGenerationStatus(
            "Clearing timetable...",
            "info"
        );


        console.log(
            "Clearing timetable for school:",
            timetableState.schoolId
        );


        // ----------------------------------------------------
        // DELETE
        // ----------------------------------------------------

        const {
            error
        } = await supabaseClient

            .from(
                "timetable_entries"
            )

            .delete()

            .eq(
                "school_id",
                timetableState.schoolId
            );


        if (
            error
        ) {

            throw new Error(
                error.message
            );

        }


        // ----------------------------------------------------
        // CLEAR LOCAL STATE
        // ----------------------------------------------------

        generatedTimetableEntries =
            [];


        // ----------------------------------------------------
        // HIDE SUMMARY
        // ----------------------------------------------------

        const summary =
            document.getElementById(
                "timetableSummary"
            );


        if (summary) {

            summary.style.display =
                "none";

        }


        // ----------------------------------------------------
        // CLEAR SUMMARY CONTENT
        // ----------------------------------------------------

        const summaryContent =
            document.getElementById(
                "timetableSummaryContent"
            );


        if (summaryContent) {

            summaryContent.innerHTML =
                "";

        }


        // ----------------------------------------------------
        // HIDE CONFLICTS
        // ----------------------------------------------------

        const conflictsContainer =
            document.getElementById(
                "timetableConflicts"
            );


        if (conflictsContainer) {

            conflictsContainer.style.display =
                "none";

        }


        const conflictsContent =
            document.getElementById(
                "timetableConflictsContent"
            );


        if (conflictsContent) {

            conflictsContent.innerHTML =
                "";

        }


        // ----------------------------------------------------
        // RELOAD DISPLAY
        // ----------------------------------------------------

        await loadGeneratedTimetable();


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        setTimetableGenerationStatus(
            "Timetable cleared successfully.",
            "success"
        );


        console.log(
            "Timetable cleared successfully."
        );

    }

    catch (error) {

        console.error(
            "Failed to clear timetable:",
            error
        );


        setTimetableGenerationStatus(
            "Failed to clear timetable: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// REGENERATE TIMETABLE
// ============================================================

async function regenerateTimetable() {

    // --------------------------------------------------------
    // CHECK SCHOOL
    // --------------------------------------------------------

    if (
        !timetableState.schoolId
    ) {

        setTimetableGenerationStatus(
            "Please select a school first.",
            "error"
        );

        return;

    }


    // --------------------------------------------------------
    // PREVENT REGENERATION WHILE RUNNING
    // --------------------------------------------------------

    if (
        timetableGenerationRunning
    ) {

        console.warn(
            "Timetable generation is already running."
        );

        return;

    }


    // --------------------------------------------------------
    // CONFIRM
    // --------------------------------------------------------

    const confirmed =
        confirm(
            "Regenerate the timetable? The current generated timetable will be replaced."
        );


    if (
        !confirmed
    ) {

        return;

    }


    // --------------------------------------------------------
    // GENERATE
    // --------------------------------------------------------

    await generateTimetable();

}


// ============================================================
// END PART 7
// ============================================================


// ============================================================
// PART 8 — PRINT, EVENTS & INITIALIZATION
// ============================================================


// ============================================================
// PRINT GENERATED TIMETABLE
// ============================================================

function printGeneratedTimetable() {

    const timetableContent =
        document.getElementById(
            "timetableContent"
        );


    if (
        !timetableContent ||
        !timetableContent.innerHTML.trim()
    ) {

        alert(
            "There is no timetable to print."
        );

        return;

    }


    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to print the timetable."
        );

        return;

    }


    printWindow.document.open();


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>
                School Timetable
            </title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    margin: 0;

                    padding: 20px;

                    color: #000;

                    background: #fff;

                }


                h1 {

                    text-align: center;

                    margin:
                        0 0 25px 0;

                    font-size: 24px;

                }


                h2,
                h3 {

                    margin-top: 20px;

                    margin-bottom: 12px;

                }


                .timetable-stream-block {

                    margin-bottom: 35px;

                    page-break-inside: avoid;

                }


                .table-responsive {

                    width: 100%;

                    overflow: visible;

                }


                table {

                    width: 100%;

                    border-collapse:
                        collapse;

                    margin-bottom: 25px;

                    page-break-inside:
                        auto;

                }


                tr {

                    page-break-inside:
                        avoid;

                    page-break-after:
                        auto;

                }


                th,
                td {

                    border:
                        1px solid #333;

                    padding:
                        7px;

                    text-align:
                        left;

                    vertical-align:
                        middle;

                    font-size:
                        12px;

                }


                th {

                    font-weight:
                        bold;

                    background:
                        #f2f2f2;

                }


                strong {

                    font-weight:
                        bold;

                }


                .empty-message,
                .empty-state,
                .loading-message {

                    padding:
                        20px;

                    text-align:
                        center;

                }


                @page {

                    size:
                        A4 landscape;

                    margin:
                        10mm;

                }


                @media print {

                    body {

                        padding: 0;

                    }


                    h1 {

                        margin-bottom:
                            15px;

                    }


                    .timetable-stream-block {

                        page-break-inside:
                            avoid;

                    }


                    table {

                        width: 100%;

                    }

                }

            </style>

        </head>


        <body>

            <h1>
                School Timetable
            </h1>

            ${timetableContent.innerHTML}

        </body>

        </html>

    `);


    printWindow.document.close();


    printWindow.focus();


    setTimeout(
        function () {

            printWindow.print();

        },
        500
    );

}


// ============================================================
// EVENT — GENERATE TIMETABLE
// ============================================================

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                "#generateTimetableBtn"
            );


        if (!button) {
            return;
        }


        event.preventDefault();

        event.stopPropagation();


        console.log(
            "🚀 GENERATE TIMETABLE BUTTON CLICKED"
        );


        console.log(
            "Generate button:",
            button
        );


        console.log(
            "School ID:",
            timetableState.schoolId
        );


        if (
            !timetableState.schoolId
        ) {

            console.error(
                "NO SCHOOL SELECTED"
            );


            setTimetableGenerationStatus(
                "Please select a school first.",
                "error"
            );


            return;

        }


        if (
            timetableGenerationRunning
        ) {

            console.warn(
                "Generation is already running."
            );


            return;

        }


        try {

            console.log(
                "CALLING generateTimetable()..."
            );


            await generateTimetable();


            console.log(
                "generateTimetable() FINISHED"
            );

        }

        catch (error) {

            console.error(
                "GENERATE TIMETABLE CLICK ERROR:",
                error
            );


            setTimetableGenerationStatus(
                "Generation failed: " +
                (
                    error.message ||
                    error
                ),
                "error"
            );

        }

    },
    true
);


// ============================================================
// EVENT — REGENERATE TIMETABLE
// ============================================================

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                "#regenerateTimetableBtn"
            );


        if (!button) {
            return;
        }


        event.preventDefault();


        console.log(
            "🔄 REGENERATE TIMETABLE BUTTON CLICKED"
        );


        try {

            await regenerateTimetable();

        }

        catch (error) {

            console.error(
                "REGENERATE TIMETABLE ERROR:",
                error
            );

        }

    }
);


// ============================================================
// EVENT — CLEAR TIMETABLE
// ============================================================

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                "#clearTimetableBtn"
            );


        if (!button) {
            return;
        }


        event.preventDefault();


        console.log(
            "🗑️ CLEAR TIMETABLE BUTTON CLICKED"
        );


        try {

            await clearGeneratedTimetable();

        }

        catch (error) {

            console.error(
                "CLEAR TIMETABLE ERROR:",
                error
            );

        }

    }
);


// ============================================================
// EVENT — PRINT TIMETABLE
// ============================================================

document.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "#printTimetableBtn"
            );


        if (!button) {
            return;
        }


        event.preventDefault();


        console.log(
            "🖨️ PRINT TIMETABLE BUTTON CLICKED"
        );


        printGeneratedTimetable();

    }
);


// ============================================================
// EVENT — STREAM FILTER
// ============================================================

document.addEventListener(
    "change",
    async function (event) {

        if (
            !event.target.matches(
                "#timetableStreamFilter"
            )
        ) {

            return;

        }


        console.log(
            "STREAM FILTER CHANGED"
        );


        await loadGeneratedTimetable();

    }
);


// ============================================================
// EVENT — DAY FILTER
// ============================================================

document.addEventListener(
    "change",
    async function (event) {

        if (
            !event.target.matches(
                "#timetableDayFilter"
            )
        ) {

            return;

        }


        console.log(
            "DAY FILTER CHANGED"
        );


        await loadGeneratedTimetable();

    }
);


// ============================================================
// EVENT — VIEW MODE
// ============================================================

document.addEventListener(
    "change",
    async function (event) {

        if (
            !event.target.matches(
                "#timetableViewMode"
            )
        ) {

            return;

        }


        console.log(
            "VIEW MODE CHANGED"
        );


        await loadGeneratedTimetable();

    }
);


// ============================================================
// INITIALIZE TIMETABLE GENERATOR
// ============================================================

async function initializeTimetableGenerator() {

    console.log(
        "======================================"
    );


    console.log(
        "INITIALIZING TIMETABLE GENERATOR"
    );


    console.log(
        "School ID:",
        timetableState.schoolId
    );


    console.log(
        "======================================"
    );


    if (
        !timetableState.schoolId
    ) {

        console.warn(
            "No school selected. Generator initialization skipped."
        );


        return;

    }


    try {

        // ----------------------------------------------------
        // LOAD FILTER OPTIONS
        // ----------------------------------------------------

        await loadTimetableFilters();


        // ----------------------------------------------------
        // LOAD EXISTING GENERATED TIMETABLE
        // ----------------------------------------------------

        await loadGeneratedTimetable();


        console.log(
            "TIMETABLE GENERATOR INITIALIZED"
        );

    }

    catch (error) {

        console.error(
            "TIMETABLE GENERATOR INITIALIZATION ERROR:",
            error
        );


        setTimetableGenerationStatus(
            "Failed to initialize timetable generator: " +
            (
                error.message ||
                error
            ),
            "error"
        );

    }

}


// ============================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================

window.generateTimetable =
    generateTimetable;


window.regenerateTimetable =
    regenerateTimetable;


window.clearGeneratedTimetable =
    clearGeneratedTimetable;


window.loadGeneratedTimetable =
    loadGeneratedTimetable;


window.renderGeneratedTimetable =
    renderGeneratedTimetable;


window.printGeneratedTimetable =
    printGeneratedTimetable;


window.loadTimetableFilters =
    loadTimetableFilters;


window.initializeTimetableGenerator =
    initializeTimetableGenerator;


// ============================================================
// GENERATOR READY
// ============================================================

console.log(
    "======================================"
);


console.log(
    "✅ TIMETABLE GENERATOR READY"
);


console.log(
    "======================================"
);
