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
