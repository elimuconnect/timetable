// ============================================================
// SMART TIMETABLE GENERATOR
// PART 1 — FOUNDATION + DATA LOADING
// ============================================================


// ============================================================
// GENERATOR STATE
// ============================================================

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
// SHUFFLE ARRAY
// ============================================================

function shuffleArray(array) {

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


    if (
        Number(first.day_number) !==
        Number(second.day_number)
    ) {

        return false;

    }


    if (
        first.period_order !== undefined &&
        second.period_order !== undefined
    ) {

        return (
            Number(second.period_order) ===
            Number(first.period_order) + 1
        );

    }


    return (
        Number(second.period_number) ===
        Number(first.period_number) + 1
    );

}


// ============================================================
// GET COMPATIBLE ROOMS
// ============================================================

function getCompatibleRooms(
    task,
    rooms
) {

    if (!task.requiresRoom) {

        return [null];

    }


    const requestedType =
        normalizeRoomType(
            task.roomType
        );


    // --------------------------------------------------------
    // Room required but no specific type
    // --------------------------------------------------------

    if (!requestedType) {

        return rooms.length
            ? shuffleArray(rooms)
            : [];

    }


    // --------------------------------------------------------
    // Specific room type required
    // --------------------------------------------------------

    return shuffleArray(
        rooms.filter(
            room => {

                return (
                    getTimetableRoomType(room) ===
                    requestedType
                );

            }
        )
    );

}


// ============================================================
// CREATE OCCUPANCY INDEXES
// ============================================================

function createOccupancyIndexes() {

    return {

        // Stream cannot teach two lessons
        // in the same period.
        streamPeriod:
            new Set(),


        // Teacher cannot teach two streams
        // in the same period.
        teacherPeriod:
            new Set(),


        // Room cannot host two lessons
        // in the same period.
        roomPeriod:
            new Set(),


        // Number of lessons assigned to a stream
        // on each day.
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
        `${streamId}__${dayNumber}`
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

    const key =
        getDailyStreamKey(
            streamId,
            dayNumber
        );


    return (
        indexes.dailyStreamLessons.get(key) ||
        0
    );

}


// ============================================================
// INCREMENT DAILY LESSON COUNT
// ============================================================

function incrementDailyStreamLessonCount(
    indexes,
    streamId,
    dayNumber
) {

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
        current + 1
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

            valid: false,

            reason:
                "Invalid task, period or occupancy indexes."

        };

    }


    // ========================================================
    // STREAM CONFLICT
    // ========================================================

    const streamKey =
        `${task.streamId}__${period.id}`;


    if (
        indexes.streamPeriod.has(
            streamKey
        )
    ) {

        return {

            valid: false,

            reason:
                "Stream already has a lesson in this period."

        };

    }


    // ========================================================
    // TEACHER CONFLICT
    // ========================================================

    if (
        task.teacherId
    ) {

        const teacherKey =
            `${task.teacherId}__${period.id}`;


        if (
            indexes.teacherPeriod.has(
                teacherKey
            )
        ) {

            return {

                valid: false,

                reason:
                    "Teacher is already teaching another stream in this period."

            };

        }

    }


    // ========================================================
    // ROOM CONFLICT
    // ========================================================

    if (
        room
    ) {

        const roomKey =
            `${room.id}__${period.id}`;


        if (
            indexes.roomPeriod.has(
                roomKey
            )
        ) {

            return {

                valid: false,

                reason:
                    "Room is already occupied in this period."

            };

        }

    }


    // ========================================================
    // DAILY MAXIMUM
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
                task.streamId,
                period.day_number
            );


        if (
            currentCount >=
            maxPerDay
        ) {

            return {

                valid: false,

                reason:
                    "Maximum lessons per day reached for this requirement."

            };

        }

    }


    return {

        valid: true

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

    const streamKey =
        `${task.streamId}__${period.id}`;


    indexes.streamPeriod.add(
        streamKey
    );


    if (
        task.teacherId
    ) {

        indexes.teacherPeriod.add(
            `${task.teacherId}__${period.id}`
        );

    }


    if (
        room
    ) {

        indexes.roomPeriod.add(
            `${room.id}__${period.id}`
        );

    }


    incrementDailyStreamLessonCount(
        indexes,
        task.streamId,
        period.day_number
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
            room
                ? room.id
                : null

    };

}

// ============================================================
// PART 4 — FIND VALID SINGLE & DOUBLE LESSON SLOTS
// ============================================================


// ============================================================
// FIND SINGLE LESSON SLOT
// ============================================================

function findSingleLessonSlot(
    task,
    periods,
    rooms,
    indexes
) {

    const shuffledPeriods =
        shuffleArray(
            periods
        );


    let attempts = 0;

    let streamConflicts = 0;
    let teacherConflicts = 0;
    let roomConflicts = 0;
    let dailyLimitConflicts = 0;


    for (
        const period of shuffledPeriods
    ) {

        const compatibleRooms =
            getCompatibleRooms(
                task,
                rooms
            );


        // ----------------------------------------------------
        // NO COMPATIBLE ROOM
        // ----------------------------------------------------

        if (
            compatibleRooms.length === 0
        ) {

            console.warn(
                "NO COMPATIBLE ROOMS",
                {

                    taskId:
                        task.taskId,

                    requiresRoom:
                        task.requiresRoom,

                    requestedRoomType:
                        task.roomType,

                    availableRooms:
                        rooms.map(
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

                }
            );


            return null;

        }


        // ----------------------------------------------------
        // TEST EACH ROOM
        // ----------------------------------------------------

        for (
            const room of compatibleRooms
        ) {

            attempts++;


            const check =
                checkSingleSlotConflict(
                    task,
                    period,
                    room,
                    indexes
                );


            if (
                !check.valid
            ) {

                if (
                    check.reason.includes(
                        "Stream already"
                    )
                ) {

                    streamConflicts++;

                }

                else if (
                    check.reason.includes(
                        "Teacher is already"
                    )
                ) {

                    teacherConflicts++;

                }

                else if (
                    check.reason.includes(
                        "Room is already"
                    )
                ) {

                    roomConflicts++;

                }

                else if (
                    check.reason.includes(
                        "Maximum lessons"
                    )
                ) {

                    dailyLimitConflicts++;

                }


                continue;

            }


            // ------------------------------------------------
            // VALID SLOT FOUND
            // ------------------------------------------------

            console.log(
                "SLOT FOUND",
                {

                    taskId:
                        task.taskId,

                    periodId:
                        period.id,

                    day:
                        period.day_name,

                    period:
                        period.period_order,

                    roomId:
                        room
                            ? room.id
                            : null,

                    room:
                        room
                            ? getTimetableRoomName(
                                room
                            )
                            : "No Room"

                }
            );


            return {

                period,
                room

            };

        }

    }


    // ========================================================
    // NO SLOT FOUND
    // ========================================================

    console.error(
        "FAILED TO FIND SINGLE LESSON SLOT",
        {

            taskId:
                task.taskId,

            streamId:
                task.streamId,

            subjectId:
                task.subjectId,

            teacherId:
                task.teacherId,

            attempts,

            streamConflicts,

            teacherConflicts,

            roomConflicts,

            dailyLimitConflicts

        }
    );


    return null;

}


// ============================================================
// FIND DOUBLE LESSON SLOT
// ============================================================

function findDoubleLessonSlot(
    task,
    periods,
    rooms,
    indexes
) {

    const periodsByDay =
        groupPeriodsByDay(
            periods
        );


    const days =
        shuffleArray(
            Object.keys(
                periodsByDay
            )
        );


    let consecutivePairs = 0;

    let streamConflicts = 0;
    let teacherConflicts = 0;
    let roomConflicts = 0;
    let dailyLimitConflicts = 0;


    // ========================================================
    // CHECK EACH DAY
    // ========================================================

    for (
        const day of days
    ) {

        const dayPeriods =
            periodsByDay[day];


        // ----------------------------------------------------
        // CHECK ADJACENT PERIOD PAIRS
        // ----------------------------------------------------

        for (
            let i = 0;
            i < dayPeriods.length - 1;
            i++
        ) {

            const firstPeriod =
                dayPeriods[i];

            const secondPeriod =
                dayPeriods[i + 1];


            // ------------------------------------------------
            // MUST BE CONSECUTIVE
            // ------------------------------------------------

            if (
                !arePeriodsConsecutive(
                    firstPeriod,
                    secondPeriod
                )
            ) {

                continue;

            }


            consecutivePairs++;


            // ------------------------------------------------
            // DAILY LIMIT
            // ------------------------------------------------

            const maxPerDay =
                Number(
                    task.maxLessonsPerDay
                ) || 0;


            const currentCount =
                getDailyStreamLessonCount(
                    indexes,
                    task.streamId,
                    firstPeriod.day_number
                );


            if (
                maxPerDay > 0 &&
                currentCount + 2 >
                maxPerDay
            ) {

                dailyLimitConflicts++;

                continue;

            }


            // ------------------------------------------------
            // GET COMPATIBLE ROOMS
            // ------------------------------------------------

            const compatibleRooms =
                getCompatibleRooms(
                    task,
                    rooms
                );


            if (
                compatibleRooms.length === 0
            ) {

                console.warn(
                    "NO COMPATIBLE ROOMS FOR DOUBLE",
                    {

                        taskId:
                            task.taskId,

                        requestedRoomType:
                            task.roomType,

                        requiresRoom:
                            task.requiresRoom,

                        rooms:
                            rooms.map(
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

                    }
                );


                return null;

            }


            // =================================================
            // TEST EACH ROOM
            // =================================================

            for (
                const room of compatibleRooms
            ) {


                // ---------------------------------------------
                // FIRST PERIOD
                // ---------------------------------------------

                const firstCheck =
                    checkSingleSlotConflict(
                        task,
                        firstPeriod,
                        room,
                        indexes
                    );


                if (
                    !firstCheck.valid
                ) {

                    if (
                        firstCheck.reason.includes(
                            "Stream already"
                        )
                    ) {

                        streamConflicts++;

                    }

                    else if (
                        firstCheck.reason.includes(
                            "Teacher is already"
                        )
                    ) {

                        teacherConflicts++;

                    }

                    else if (
                        firstCheck.reason.includes(
                            "Room is already"
                        )
                    ) {

                        roomConflicts++;

                    }

                    continue;

                }


                // ---------------------------------------------
                // SECOND PERIOD
                // ---------------------------------------------

                const secondCheck =
                    checkSingleSlotConflict(
                        task,
                        secondPeriod,
                        room,
                        indexes
                    );


                if (
                    !secondCheck.valid
                ) {

                    if (
                        secondCheck.reason.includes(
                            "Stream already"
                        )
                    ) {

                        streamConflicts++;

                    }

                    else if (
                        secondCheck.reason.includes(
                            "Teacher is already"
                        )
                    ) {

                        teacherConflicts++;

                    }

                    else if (
                        secondCheck.reason.includes(
                            "Room is already"
                        )
                    ) {

                        roomConflicts++;

                    }

                    continue;

                }


                // =================================================
                // DOUBLE SLOT FOUND
                // =================================================

                console.log(
                    "DOUBLE SLOT FOUND",
                    {

                        taskId:
                            task.taskId,

                        firstPeriodId:
                            firstPeriod.id,

                        secondPeriodId:
                            secondPeriod.id,

                        day:
                            firstPeriod.day_name,

                        roomId:
                            room
                                ? room.id
                                : null,

                        room:
                            room
                                ? getTimetableRoomName(
                                    room
                                )
                                : "No Room"

                    }
                );


                return {

                    firstPeriod:
                        firstPeriod,

                    secondPeriod:
                        secondPeriod,

                    room:
                        room

                };

            }

        }

    }


    // ========================================================
    // NO DOUBLE SLOT FOUND
    // ========================================================

    console.error(
        "FAILED TO FIND DOUBLE LESSON SLOT",
        {

            taskId:
                task.taskId,

            streamId:
                task.streamId,

            subjectId:
                task.subjectId,

            teacherId:
                task.teacherId,

            consecutivePairs,

            streamConflicts,

            teacherConflicts,

            roomConflicts,

            dailyLimitConflicts

        }
    );


    return null;

}
// ============================================================
// PART 5 — GENERATE TIMETABLE
// ============================================================

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
            typeof showTimetableConflicts ===
            "function"
        ) {

            showTimetableConflicts(
                conflicts,
                lookup
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


        // ====================================================
        // DO NOT CALL loadTimetableFilters()
        // ====================================================
        //
        // It is currently not guaranteed to exist.
        // The generator must not fail because of it.
        //
        // Filters can be handled separately later.
        // ====================================================


        // ====================================================
        // SUCCESS STATUS
        // ====================================================

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
