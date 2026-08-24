
// ============================================================
// SMART TIMETABLE GENERATOR
// STAGE 2 — DATA MODEL, LOADING, NORMALIZATION & VALIDATION
// ============================================================

let generatedTimetableEntries = [];

let timetableGenerationRunning = false;


// ============================================================
// GET TIMETABLE DOM ELEMENTS
// ============================================================

const generateTimetableBtn =
    document.getElementById("generateTimetableBtn");

const regenerateTimetableBtn =
    document.getElementById("regenerateTimetableBtn");

const clearTimetableBtn =
    document.getElementById("clearTimetableBtn");

const printTimetableBtn =
    document.getElementById("printTimetableBtn");

const timetableStreamFilter =
    document.getElementById("timetableStreamFilter");

const timetableDayFilter =
    document.getElementById("timetableDayFilter");

const timetableViewMode =
    document.getElementById("timetableViewMode");


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
// NORMALIZED GENERATOR DATA MODEL
// ============================================================

const generatorData = {

    school: null,

    schoolId: null,

    streams: [],

    subjects: [],

    teachers: [],

    rooms: [],

    periods: [],

    requirements: [],
     lessonTasks: [],

    lookup: {

        streams:
            new Map(),

        subjects:
            new Map(),

        teachers:
            new Map(),

        rooms:
            new Map(),

        periods:
            new Map()

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


    const safeMessage =
        typeof escapeHtml === "function"
            ? escapeHtml(String(message))
            : String(message);


    status.innerHTML = `
        <div class="timetable-status ${type}">
            ${safeMessage}
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
// DISPLAY NAME HELPERS
// IMPORTANT:
// These functions are declared BEFORE any filter/render code
// ============================================================


// ============================================================
// STREAM NAME
// ============================================================

function getTimetableStreamName(stream) {

    if (!stream) {

        return "Unknown Stream";

    }


    return (

        stream.stream_name ||

        stream.name ||

        stream.class_name ||

        stream.stream ||

        "Unknown Stream"

    );

}


// ============================================================
// SUBJECT NAME
// ============================================================

function getTimetableSubjectName(subject) {

    if (!subject) {

        return "Unknown Subject";

    }


    return (

        subject.subject_name ||

        subject.name ||

        subject.subject ||

        subject.code ||

        "Unknown Subject"

    );

}


// ============================================================
// TEACHER NAME
// ============================================================

function getTimetableTeacherName(teacher) {

    if (!teacher) {

        return "Unassigned";

    }


    const fullName = [

        teacher.first_name,

        teacher.middle_name,

        teacher.last_name

    ]
        .filter(Boolean)
        .join(" ")
        .trim();


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
// ROOM NAME
// ============================================================

function getTimetableRoomName(room) {

    if (!room) {

        return "No Room";

    }


    return (

        room.room_name ||

        room.name ||

        room.room ||

        room.location ||

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
// ROOM TYPE
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
// LOAD GENERATOR DATA
// ============================================================

async function loadTimetableGeneratorData() {

    if (
        !timetableState ||
        !timetableState.schoolId
    ) {

        throw new Error(
            "Please select a school first."
        );

    }


    const schoolId =
        timetableState.schoolId;


    console.log(
        "======================================"
    );

    console.log(
        "LOADING TIMETABLE GENERATOR DATA"
    );

    console.log(
        "School:",
        schoolId
    );

    console.log(
        "======================================"
    );


    // ========================================================
    // LOAD ALL REQUIRED DATA IN PARALLEL
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
            .eq(
                "school_id",
                schoolId
            ),

        supabaseClient
            .from("timetable_periods")
            .select("*")
            .eq(
                "school_id",
                schoolId
            )
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
            .eq(
                "school_id",
                schoolId
            ),

        supabaseClient
            .from("timetable_subjects")
            .select("*")
            .eq(
                "school_id",
                schoolId
            ),

        supabaseClient
            .from("timetable_teachers")
            .select("*")
            .eq(
                "school_id",
                schoolId
            ),

        supabaseClient
            .from("timetable_rooms")
            .select("*")
            .eq(
                "school_id",
                schoolId
            )

    ]);


    // ========================================================
    // DATABASE ERROR CHECK
    // ========================================================

    const databaseResults = [

        {
            name:
                "requirements",

            result:
                requirementsResult

        },

        {
            name:
                "periods",

            result:
                periodsResult

        },

        {
            name:
                "streams",

            result:
                streamsResult

        },

        {
            name:
                "subjects",

            result:
                subjectsResult

        },

        {
            name:
                "teachers",

            result:
                teachersResult

        },

        {
            name:
                "rooms",

            result:
                roomsResult

        }

    ];


    for (
        const item
        of databaseResults
    ) {

        if (
            item.result &&
            item.result.error
        ) {

            console.error(

                `Failed to load timetable ${item.name}:`,

                item.result.error

            );


            throw new Error(

                `Failed to load timetable ${item.name}: ` +

                item.result.error.message

            );

        }

    }


    // ========================================================
    // BUILD RESULT
    // ========================================================

    const result = {

        schoolId,

        requirements:
            Array.isArray(
                requirementsResult.data
            )
                ? requirementsResult.data
                : [],

        periods:
            Array.isArray(
                periodsResult.data
            )
                ? periodsResult.data
                : [],

        streams:
            Array.isArray(
                streamsResult.data
            )
                ? streamsResult.data
                : [],

        subjects:
            Array.isArray(
                subjectsResult.data
            )
                ? subjectsResult.data
                : [],

        teachers:
            Array.isArray(
                teachersResult.data
            )
                ? teachersResult.data
                : [],

        rooms:
            Array.isArray(
                roomsResult.data
            )
                ? roomsResult.data
                : []

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

function buildTimetableLookupMaps(data) {

    const lookup = {

        streams:
            new Map(),

        subjects:
            new Map(),

        teachers:
            new Map(),

        rooms:
            new Map(),

        periods:
            new Map(),

        requirements:
            new Map()

    };


    if (
        !data ||
        typeof data !== "object"
    ) {

        console.warn(
            "buildTimetableLookupMaps: Invalid data."
        );

        return lookup;

    }


    // --------------------------------------------------------
    // STREAMS
    // --------------------------------------------------------

    (data.streams || [])
        .forEach(
            item => {

                if (item?.id) {

                    lookup.streams.set(
                        item.id,
                        item
                    );

                }

            }
        );


    // --------------------------------------------------------
    // SUBJECTS
    // --------------------------------------------------------

    (data.subjects || [])
        .forEach(
            item => {

                if (item?.id) {

                    lookup.subjects.set(
                        item.id,
                        item
                    );

                }

            }
        );


    // --------------------------------------------------------
    // TEACHERS
    // --------------------------------------------------------

    (data.teachers || [])
        .forEach(
            item => {

                if (item?.id) {

                    lookup.teachers.set(
                        item.id,
                        item
                    );

                }

            }
        );


    // --------------------------------------------------------
    // ROOMS
    // --------------------------------------------------------

    (data.rooms || [])
        .forEach(
            item => {

                if (item?.id) {

                    lookup.rooms.set(
                        item.id,
                        item
                    );

                }

            }
        );


    // --------------------------------------------------------
    // PERIODS
    // --------------------------------------------------------

    (data.periods || [])
        .forEach(
            item => {

                if (item?.id) {

                    lookup.periods.set(
                        item.id,
                        item

                    );

                }

            }
        );


    // --------------------------------------------------------
    // REQUIREMENTS
    // --------------------------------------------------------
    //
    // Requirements are already normalized before this
    // function is called.
    //
    // Therefore the normalized requirement ID is:
    //
    //     requirement.requirementId
    //
    // NOT:
    //
    //     requirement.id
    //
    // --------------------------------------------------------

    (data.requirements || [])
        .forEach(
            requirement => {

                const requirementId =
                    requirement?.requirementId;


                if (
                    requirementId
                ) {

                    lookup.requirements.set(
                        requirementId,
                        requirement
                    );

                }

            }
        );


    // --------------------------------------------------------
    // DEBUG
    // --------------------------------------------------------

    console.log(
        "Timetable lookup maps built:",
        {

            streams:
                lookup.streams.size,

            subjects:
                lookup.subjects.size,

            teachers:
                lookup.teachers.size,

            rooms:
                lookup.rooms.size,

            periods:
                lookup.periods.size,

            requirements:
                lookup.requirements.size

        }
    );


    return lookup;

}

// ============================================================
// NORMALIZE GENERATOR DATA
// ============================================================

function normalizeGeneratorData(data) {

    const normalized = {

        school:
            data?.school || null,

        schoolId:
            data?.schoolId ||
            timetableState?.schoolId ||
            null,

        streams:
            Array.isArray(data?.streams)
                ? [...data.streams]
                : [],

        subjects:
            Array.isArray(data?.subjects)
                ? [...data.subjects]
                : [],

        teachers:
            Array.isArray(data?.teachers)
                ? [...data.teachers]
                : [],

        rooms:
            Array.isArray(data?.rooms)
                ? [...data.rooms]
                : [],

        periods:
            Array.isArray(data?.periods)
                ? [...data.periods]
                : [],

        requirements:
            Array.isArray(data?.requirements)
                ? [...data.requirements]
                : [],

        lookup: {

            streams:
                new Map(),

            subjects:
                new Map(),

            teachers:
                new Map(),

            rooms:
                new Map(),

            periods:
                new Map()

        }

    };

// ========================================================
// NORMALIZE PERIODS
// ========================================================

normalized.periods =
    normalized.periods.map(
        period => {

            const periodType =
                String(
                    period.period_type ||
                    "lesson"
                )
                    .trim()
                    .toLowerCase();


            return {

                ...period,

                dayNumber:
                    Number(
                        period.day_number
                    ) || 0,

                periodNumber:
                    Number(
                        period.period_number
                    ) || 0,

                periodOrder:
                    Number(
                        period.period_order
                    ) || 0,

                isTeachingPeriod:
                    period.is_teaching_period !== false,

                periodType

            };

        }
    );

    // ========================================================
    // NORMALIZE REQUIREMENTS
    // ========================================================

    normalized.requirements =
        normalized.requirements.map(
            requirement => {

                const lessonsPerWeek =
                    Number(
                        requirement.lessons_per_week
                    );


                const doubleLessonsPerWeek =
                    Number(
                        requirement.double_lessons_per_week
                    );


                const maxLessonsPerDay =
                    Number(
                        requirement.max_lessons_per_day
                    );


                return {

                    requirementId:
                        requirement.id ||
                        null,

                    schoolId:
                        requirement.school_id ||
                        normalized.schoolId ||
                        null,

                    streamId:
                        requirement.stream_id ||
                        null,

                    subjectId:
                        requirement.subject_id ||
                        null,

                    teacherId:
                        requirement.teacher_id ||
                        null,

                    lessonsPerWeek:
                        Number.isFinite(
                            lessonsPerWeek
                        )
                            ? Math.max(
                                0,
                                lessonsPerWeek
                            )
                            : 0,

                    doubleLessonsPerWeek:
                        Number.isFinite(
                            doubleLessonsPerWeek
                        )
                            ? Math.max(
                                0,
                                doubleLessonsPerWeek
                            )
                            : 0,

                    requiresRoom:
                        requirement.requires_room === true,

                    roomType:
                        normalizeRoomType(
                            requirement.room_type
                        ),

                    maxLessonsPerDay:
                        Number.isFinite(
                            maxLessonsPerDay
                        )
                            ? Math.max(
                                1,
                                maxLessonsPerDay
                            )
                            : 1

                };

            }
        );


    // ========================================================
    // NORMALIZE TEACHERS
    // ========================================================

    normalized.teachers =
        normalized.teachers.map(
            teacher => {

                return {

                    ...teacher,

                    maxLessonsPerDay:
                        Number(
                            teacher.max_lessons_per_day
                        ) > 0
                            ? Number(
                                teacher.max_lessons_per_day
                            )
                            : 6,

                    maxLessonsPerWeek:
                        Number(
                            teacher.max_lessons_per_week
                        ) > 0
                            ? Number(
                                teacher.max_lessons_per_week
                            )
                            : 30,

                    maxConsecutiveLessons:
                        Number(
                            teacher.max_consecutive_lessons
                        ) > 0
                            ? Number(
                                teacher.max_consecutive_lessons
                            )
                            : 3

                };

            }
        );


    // ========================================================
    // NORMALIZE ROOMS
    // ========================================================

    normalized.rooms =
        normalized.rooms.map(
            room => {

                return {

                    ...room,

                    roomType:
                        getTimetableRoomType(
                            room
                        ) ||
                        "classroom",

                    available:
                        room.available !== false

                };

            }
        );


    // ========================================================
    // REBUILD LOOKUPS
    // ========================================================

    normalized.lookup =
        buildTimetableLookupMaps(
            normalized
        );


    console.log(
        "Generator data normalized successfully."
    );


    return normalized;

}


// ============================================================
// VALIDATE GENERATOR RELATIONSHIPS
// ============================================================

function validateGeneratorRelationships(data) {

    const errors = [];

    const warnings = [];


    if (
        !data ||
        typeof data !== "object"
    ) {

        return {

            valid: false,

            errors: [
                {
                    type:
                        "NO_DATA",

                    message:
                        "No generator data was supplied."
                }
            ],

            warnings

        };

    }


    // ========================================================
    // SCHOOL
    // ========================================================

    const schoolId =
        data.schoolId ||
        timetableState?.schoolId ||
        null;


    if (!schoolId) {

        errors.push({

            type:
                "MISSING_SCHOOL",

            message:
                "No school has been selected."

        });

    }


    // ========================================================
    // REQUIREMENTS
    // ========================================================

    data.requirements.forEach(
        requirement => {

            const requirementId =
                requirement.requirementId;


            if (!requirementId) {

                errors.push({

                    type:
                        "INVALID_REQUIREMENT",

                    message:
                        "A timetable requirement has no ID."

                });

                return;

            }


            // ------------------------------------------------
            // SCHOOL
            // ------------------------------------------------

            if (
                requirement.schoolId &&
                schoolId &&
                requirement.schoolId !== schoolId
            ) {

                errors.push({

                    type:
                        "WRONG_SCHOOL",

                    requirementId,

                    message:
                        "Requirement belongs to another school."

                });

            }


            // ------------------------------------------------
            // STREAM
            // ------------------------------------------------

            if (
                !requirement.streamId
            ) {

                errors.push({

                    type:
                        "MISSING_STREAM",

                    requirementId,

                    message:
                        "Requirement has no stream assigned."

                });

            }

            else if (
                !data.lookup.streams.has(
                    requirement.streamId
                )
            ) {

                errors.push({

                    type:
                        "MISSING_STREAM",

                    requirementId,

                    streamId:
                        requirement.streamId,

                    message:
                        "Requirement references a stream that does not exist."

                });

            }


            // ------------------------------------------------
            // SUBJECT
            // ------------------------------------------------

            if (
                !requirement.subjectId
            ) {

                errors.push({

                    type:
                        "MISSING_SUBJECT",

                    requirementId,

                    message:
                        "Requirement has no subject assigned."

                });

            }

            else if (
                !data.lookup.subjects.has(
                    requirement.subjectId
                )
            ) {

                errors.push({

                    type:
                        "MISSING_SUBJECT",

                    requirementId,

                    subjectId:
                        requirement.subjectId,

                    message:
                        "Requirement references a subject that does not exist."

                });

            }


            // ------------------------------------------------
            // TEACHER
            // ------------------------------------------------

            if (
                !requirement.teacherId
            ) {

                warnings.push({

                    type:
                        "MISSING_TEACHER",

                    requirementId,

                    message:
                        "No teacher is assigned to this requirement."

                });

            }

            else if (
                !data.lookup.teachers.has(
                    requirement.teacherId
                )
            ) {

                errors.push({

                    type:
                        "MISSING_TEACHER",

                    requirementId,

                    teacherId:
                        requirement.teacherId,

                    message:
                        "Requirement references a teacher that does not exist."

                });

            }


            // ------------------------------------------------
            // LESSON COUNT
            // ------------------------------------------------

            if (
                !Number.isFinite(
                    requirement.lessonsPerWeek
                ) ||
                requirement.lessonsPerWeek <= 0
            ) {

                errors.push({

                    type:
                        "INVALID_LESSONS_PER_WEEK",

                    requirementId,

                    message:
                        "Lessons per week must be greater than zero."

                });

            }


            // ------------------------------------------------
            // DOUBLE LESSON COUNT
            // ------------------------------------------------

            if (
                requirement.doubleLessonsPerWeek < 0
            ) {

                errors.push({

                    type:
                        "INVALID_DOUBLE_LESSONS",

                    requirementId,

                    message:
                        "Double lessons per week cannot be negative."

                });

            }


            if (
                requirement.doubleLessonsPerWeek >
                Math.floor(
                    requirement.lessonsPerWeek / 2
                )
            ) {

                errors.push({

                    type:
                        "INVALID_DOUBLE_LESSONS",

                    requirementId,

                    message:
                        "The requested number of double lessons is greater than the available lesson count."

                });

            }


            // ------------------------------------------------
            // MAX LESSONS PER DAY
            // ------------------------------------------------

            if (
                requirement.maxLessonsPerDay <= 0
            ) {

                errors.push({

                    type:
                        "INVALID_MAX_LESSONS_PER_DAY",

                    requirementId,

                    message:
                        "Maximum lessons per day must be greater than zero."

                });

            }


            // ------------------------------------------------
            // ROOM VALIDATION
            // ------------------------------------------------

            if (
                requirement.requiresRoom
            ) {

                const matchingRooms =
                    data.rooms.filter(
                        room => {

                            if (
                                room.available === false
                            ) {

                                return false;

                            }


                            if (
                                !requirement.roomType
                            ) {

                                return true;

                            }


                            return (
                                getTimetableRoomType(
                                    room
                                ) ===
                                requirement.roomType
                            );

                        }
                    );


                if (
                    matchingRooms.length === 0
                ) {

                    errors.push({

                        type:
                            "NO_ROOM",

                        requirementId,

                        roomType:
                            requirement.roomType,

                        message:
                            requirement.roomType
                                ? `No available room of type "${requirement.roomType}" exists.`
                                : "Requirement requires a room but no available room exists."

                    });

                }

            }

        }
    );


    // ========================================================
    // RESULT
    // ========================================================

    const result = {

        valid:
            errors.length === 0,

        errors,

        warnings

    };


    console.log(
        "Generator relationship validation:",
        {
            valid:
                result.valid,

            errors:
                errors.length,

            warnings:
                warnings.length
        }
    );


    if (errors.length > 0) {

        console.error(
            "Generator relationship errors:",
            errors
        );

    }


    if (warnings.length > 0) {

        console.warn(
            "Generator relationship warnings:",
            warnings
        );

    }


    return result;

}


// ============================================================
// VALIDATE NORMALIZED PERIODS
// ============================================================

function validateTimetablePeriods(data) {

    const errors = [];

    const warnings = [];


    if (
        !data ||
        !Array.isArray(data.periods)
    ) {

        return {

            valid: false,

            errors: [
                "No timetable periods are available."
            ],

            warnings

        };

    }


    const periodIds =
        new Set();


    const duplicateIds =
        new Set();


    // ========================================================
    // VALIDATE EACH PERIOD
    // ========================================================

    data.periods.forEach(
        period => {

            const periodId =
                period.id ||
                null;


            // ------------------------------------------------
            // ID
            // ------------------------------------------------

            if (!periodId) {

                errors.push(
                    "A timetable period has no ID."
                );

            }
            else {

                if (
                    periodIds.has(
                        periodId
                    )
                ) {

                    duplicateIds.add(
                        periodId
                    );

                }

                periodIds.add(
                    periodId
                );

            }


            // ------------------------------------------------
            // DAY
            // ------------------------------------------------

            if (
                !period.dayName &&
                (!period.dayNumber ||
                    period.dayNumber <= 0)
            ) {

                errors.push(
                    `Period ${periodId || "[unknown]"} has no valid day information.`
                );

            }


            // ------------------------------------------------
            // PERIOD ORDER
            // ------------------------------------------------

            if (
                !Number.isFinite(
                    period.periodOrder
                ) ||
                period.periodOrder <= 0
            ) {

                errors.push(
                    `Period ${periodId || "[unknown]"} has an invalid period order.`
                );

            }


            // ------------------------------------------------
            // PERIOD NUMBER
            // ------------------------------------------------

            if (
                !Number.isFinite(
                    period.periodNumber
                ) ||
                period.periodNumber <= 0
            ) {

                warnings.push(
                    `Period ${periodId || "[unknown]"} has no valid period number.`
                );

            }


            // ------------------------------------------------
            // PERIOD TYPE
            // ------------------------------------------------

            if (
                !period.periodType
            ) {

                warnings.push(
                    `Period ${periodId || "[unknown]"} has no period type.`
                );

            }


            // ------------------------------------------------
            // TIME RANGE
            // ------------------------------------------------

            if (
                !period.startTime ||
                !period.endTime
            ) {

                warnings.push(
                    `Period ${periodId || "[unknown]"} has incomplete time information.`
                );

            }

        }
    );


    // ========================================================
    // DUPLICATE IDS
    // ========================================================

    duplicateIds.forEach(
        id => {

            errors.push(
                `Duplicate timetable period ID detected: ${id}`
            );

        }
    );


    // ========================================================
    // RESULT
    // ========================================================

    const result = {

        valid:
            errors.length === 0,

        errors,

        warnings

    };


    console.log(
        "Timetable period validation:",
        {
            valid:
                result.valid,

            errors:
                result.errors.length,

            warnings:
                result.warnings.length
        }
    );


    if (
        result.errors.length
    ) {

        console.error(
            "Timetable period validation errors:",
            result.errors
        );

    }


    if (
        result.warnings.length
    ) {

        console.warn(
            "Timetable period validation warnings:",
            result.warnings
        );

    }


    return result;

}


// ============================================================
// GET TEACHING PERIODS
// ============================================================
// IMPORTANT:
// At this stage, periods have already been normalized.
// Therefore, all generator logic uses the normalized
// camelCase fields only.
// ============================================================

function getTeachingPeriods(periods) {

    if (
        !Array.isArray(periods)
    ) {

        return [];

    }


    return periods.filter(
        period => {

            return (

                period.isTeachingPeriod !== false &&

                period.periodType !== "break" &&

                period.periodType !== "lunch"

            );

        }
    );

}

// ============================================================
// GROUP PERIODS BY DAY
// ============================================================




function groupPeriodsByDay(periods) {

    const groups = {};


    if (
        !Array.isArray(periods)
    ) {

        return groups;

    }


    periods.forEach(
        period => {

            const day =
                period.dayName ||
                `Day ${period.dayNumber}`;


            if (
                !groups[day]
            ) {

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
                                a.periodOrder
                            ) || 0;


                        const orderB =
                            Number(
                                b.periodOrder
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
// DEBUG / DIAGNOSTIC SUMMARY
// ============================================================

function logTimetableGeneratorSummary(data) {

    if (!data) {

        console.warn(
            "No timetable generator data to summarize."
        );

        return;

    }


    console.log(
        "======================================"
    );

    console.log(
        "TIMETABLE GENERATOR DATA SUMMARY"
    );

    console.log(
        "======================================"
    );


    console.log(
        "School:",
        data.schoolId
    );

    console.log(
        "Requirements:",
        data.requirements.length
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

    console.log(
        "Periods:",
        data.periods.length
    );


    console.log(
        "Teaching periods:",
        getTeachingPeriods(
            data.periods
        ).length
    );


    console.log(
        "======================================"
    );

}


// ============================================================
// VALIDATE TIMETABLE GENERATOR DATA
// ============================================================
//
// Performs basic structural validation of normalized
// generator data.
//
// This function is intentionally separate from:
//
//     validateTimetablePeriods()
//     validateGeneratorRelationships()
//     validateLessonTasks()
//
// Those functions perform deeper validation.
//
// This function checks that the main generator data
// collections exist and contain sensible values.
//
// ============================================================

function validateTimetableGeneratorData(
    data
) {

    const errors = [];


    const warnings = [];


    // ========================================================
    // BASIC OBJECT VALIDATION
    // ========================================================

    if (
        !data ||
        typeof data !== "object"
    ) {

        return {

            valid:
                false,

            errors:
                [
                    "Generator data is missing or invalid."
                ],

            warnings

        };

    }


    // ========================================================
    // SCHOOL
    // ========================================================

    if (
        !data.schoolId
    ) {

        errors.push(
            "No school ID is available for timetable generation."
        );

    }


    // ========================================================
    // COLLECTION VALIDATION
    // ========================================================

    const collections = [

        {
            name:
                "streams",

            value:
                data.streams
        },

        {
            name:
                "subjects",

            value:
                data.subjects
        },

        {
            name:
                "teachers",

            value:
                data.teachers
        },

        {
            name:
                "rooms",

            value:
                data.rooms
        },

        {
            name:
                "periods",

            value:
                data.periods
        },

        {
            name:
                "requirements",

            value:
                data.requirements
        }

    ];


    collections.forEach(
        collection => {

            if (
                !Array.isArray(
                    collection.value
                )
            ) {

                errors.push(

                    `${collection.name} must be an array.`

                );

            }

        }
    );


    // ========================================================
    // EMPTY COLLECTION WARNINGS
    // ========================================================
    //
    // These are warnings here because some data may
    // legitimately be empty during setup.
    //
    // Deeper validation determines whether generation
    // can actually proceed.
    //
    // ========================================================

    collections.forEach(
        collection => {

            if (
                Array.isArray(
                    collection.value
                ) &&
                collection.value.length === 0
            ) {

                warnings.push(

                    `${collection.name} is empty.`

                );

            }

        }
    );


    // ========================================================
    // REQUIREMENT COUNT
    // ========================================================

    if (
        Array.isArray(data.requirements) &&
        data.requirements.length === 0
    ) {

        errors.push(
            "No timetable requirements are available."
        );

    }


    // ========================================================
    // PERIOD COUNT
    // ========================================================

    if (
        Array.isArray(data.periods)
    ) {

        const teachingPeriods =
            data.periods.filter(
                period =>
                    period &&
                    period.isTeachingPeriod !== false &&
                    period.periodType !== "break" &&
                    period.periodType !== "lunch"
            );


        if (
            teachingPeriods.length === 0
        ) {

            errors.push(
                "No teaching periods are available for timetable generation."
            );

        }

    }


    // ========================================================
    // RESULT
    // ========================================================

    const result = {

        valid:
            errors.length === 0,

        errors,

        warnings

    };


    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
        "Timetable generator basic validation:",
        {

            valid:
                result.valid,

            errors:
                result.errors.length,

            warnings:
                result.warnings.length

        }
    );


    if (
        errors.length > 0
    ) {

        console.error(
            "Timetable generator basic validation errors:",
            errors
        );

    }


    if (
        warnings.length > 0
    ) {

        console.warn(
            "Timetable generator basic validation warnings:",
            warnings
        );

    }


    // ========================================================
    // RETURN
    // ========================================================

    return result;

}





// ============================================================
// INITIAL DATA PREPARATION HELPER
// ============================================================
// This gives the later generator stages ONE clean pipeline:
// LOAD → NORMALIZE → VALIDATE → READY
// ============================================================

// ============================================================
// GENERATOR DATA PREPARATION PIPELINE
// STAGE 2 → STAGE 3 HANDOFF
// ============================================================
// Pipeline:
//
// LOAD
//   ↓
// NORMALIZE
//   ↓
// BASIC VALIDATION
//   ↓
// PERIOD VALIDATION
//   ↓
// RELATIONSHIP VALIDATION
//   ↓
// CREATE LESSON TASKS
//   ↓
// VALIDATE LESSON TASKS
//   ↓
// STORE READY GENERATOR DATA
//
// ============================================================

async function prepareTimetableGeneratorData() {

    console.log(
        "======================================"
    );

    console.log(
        "PREPARING TIMETABLE GENERATOR DATA"
    );

    console.log(
        "======================================"
    );


    // ========================================================
    // STEP 1 — LOAD
    // ========================================================

    const rawData =
        await loadTimetableGeneratorData();


    // ========================================================
    // STEP 2 — NORMALIZE
    // ========================================================

    const normalizedData =
        normalizeGeneratorData(
            rawData
        );


    // ========================================================
    // STEP 3 — BASIC VALIDATION
    // ========================================================

    validateTimetableGeneratorData(
        normalizedData
    );


    // ========================================================
    // STEP 4 — PERIOD VALIDATION
    // ========================================================

    const periodValidation =
        validateTimetablePeriods(
            normalizedData
        );


    if (
        !periodValidation.valid
    ) {

        throw new Error(

            "Timetable period validation failed:\n\n" +

            periodValidation.errors.join(
                "\n"
            )

        );

    }


    // ========================================================
    // STEP 5 — RELATIONSHIP VALIDATION
    // ========================================================

    const relationshipValidation =
        validateGeneratorRelationships(
            normalizedData
        );


    if (
        !relationshipValidation.valid
    ) {

        const messages =
            relationshipValidation.errors
                .map(
                    error =>
                        error.message
                );


        throw new Error(

            "Timetable generator relationship validation failed:\n\n" +

            messages.join(
                "\n"
            )

        );

    }


    // ========================================================
    // STEP 6 — CREATE LESSON TASKS
    // ========================================================

    const lessonTasks =
        createLessonTasks(
            normalizedData.requirements,
            normalizedData.lookup
        );


    // ========================================================
    // STEP 7 — VALIDATE LESSON TASKS
    // ========================================================

    validateLessonTasks(
        normalizedData,
        lessonTasks
    );


    // ========================================================
    // STEP 8 — ATTACH TASKS TO NORMALIZED DATA
    // ========================================================

    normalizedData.lessonTasks =
        lessonTasks;


    // ========================================================
    // STEP 9 — UPDATE GLOBAL GENERATOR DATA
    // ========================================================

    generatorData.school =
        normalizedData.school;

    generatorData.schoolId =
        normalizedData.schoolId;

    generatorData.streams =
        normalizedData.streams;

    generatorData.subjects =
        normalizedData.subjects;

    generatorData.teachers =
        normalizedData.teachers;

    generatorData.rooms =
        normalizedData.rooms;

    generatorData.periods =
        normalizedData.periods;

    generatorData.requirements =
        normalizedData.requirements;

    generatorData.lessonTasks =
        normalizedData.lessonTasks;

    generatorData.lookup =
        normalizedData.lookup;


    // ========================================================
    // STEP 10 — SUMMARY
    // ========================================================

    logTimetableGeneratorSummary(
        normalizedData
    );


    console.log(
        "======================================"
    );

    console.log(
        "TIMETABLE GENERATOR DATA READY"
    );

    console.log(
        "Requirements:",
        normalizedData.requirements.length
    );

    console.log(
        "Lesson tasks:",
        normalizedData.lessonTasks.length
    );

    console.log(
        "Teaching periods:",
        getTeachingPeriods(
            normalizedData.periods
        ).length
    );

    console.log(
        "======================================"
    );


    return normalizedData;

}



// ============================================================
// STAGE 3 — LESSON TASK CREATION
// ============================================================
// Converts timetable requirements into atomic scheduling tasks.
//
// Example:
//
// lessonsPerWeek = 5
// doubleLessonsPerWeek = 2
//
// Result:
//
// DOUBLE 1 → 2 periods
// DOUBLE 2 → 2 periods
// SINGLE 1 → 1 period
//
// Total = 5 periods
//
// IMPORTANT:
// A task is a scheduling unit.
// A double task occupies TWO consecutive teaching periods.
// ============================================================

function createLessonTasks(
    requirements,
    lookup
) {

    const tasks = [];


    if (
        !Array.isArray(requirements)
    ) {

        throw new Error(
            "Cannot create lesson tasks: requirements are not available."
        );

    }


    if (
        !lookup ||
        !lookup.streams ||
        !lookup.subjects ||
        !lookup.teachers
    ) {

        throw new Error(
            "Cannot create lesson tasks: generator lookup maps are unavailable."
        );

    }


    // ========================================================
    // PROCESS REQUIREMENTS
    // ========================================================

    requirements.forEach(
        requirement => {

            const lessonsPerWeek =
                Number(
                    requirement.lessonsPerWeek
                ) || 0;


            const requestedDoubles =
                Math.max(
                    0,
                    Number(
                        requirement.doubleLessonsPerWeek
                    ) || 0
                );


            if (
                lessonsPerWeek <= 0
            ) {

                return;

            }


            // =================================================
            // RELATED ENTITIES
            // =================================================

            const stream =
                lookup.streams.get(
                    requirement.streamId
                );


            const subject =
                lookup.subjects.get(
                    requirement.subjectId
                );


            const teacher =
                requirement.teacherId
                    ? lookup.teachers.get(
                        requirement.teacherId
                    )
                    : null;


            // =================================================
            // RELATIONSHIP SAFETY
            // =================================================

            if (!stream) {

                throw new Error(

                    `Cannot create lesson tasks: ` +

                    `stream ${requirement.streamId} ` +

                    `does not exist for requirement ` +

                    `${requirement.requirementId}.`

                );

            }


            if (!subject) {

                throw new Error(

                    `Cannot create lesson tasks: ` +

                    `subject ${requirement.subjectId} ` +

                    `does not exist for requirement ` +

                    `${requirement.requirementId}.`

                );

            }


            // Teacher can intentionally be unassigned,
            // because relationship validation treats it
            // as a warning rather than a fatal error.


            // =================================================
            // DOUBLE LESSON CALCULATION
            // =================================================

            const doubleCount =
                Math.min(

                    requestedDoubles,

                    Math.floor(
                        lessonsPerWeek / 2
                    )

                );


            const periodsUsedByDoubles =
                doubleCount * 2;


            const singleCount =
                lessonsPerWeek -
                periodsUsedByDoubles;


            // =================================================
            // COMMON TASK DATA
            // =================================================

            const commonTaskData = {

                requirementId:
                    requirement.requirementId,

                schoolId:
                    requirement.schoolId,

                streamId:
                    requirement.streamId,

                subjectId:
                    requirement.subjectId,

                teacherId:
                    requirement.teacherId ||
                    null,

                requiresRoom:
                    requirement.requiresRoom === true,

                roomType:
                    normalizeRoomType(
                        requirement.roomType
                    ),

                maxLessonsPerDay:
                    Number(
                        requirement.maxLessonsPerDay
                    ) || 1

            };


            // =================================================
            // CREATE DOUBLE TASKS
            // =================================================

            for (
                let index = 0;
                index < doubleCount;
                index++
            ) {

                tasks.push({

                    ...commonTaskData,

                    taskId:
                        `${requirement.requirementId}-D${index + 1}`,

                    taskType:
                        "double",

                    duration:
                        2,

                    sequence:
                        index + 1,

                    placed:
                        false,

                    periodIds:
                        [],

                    roomId:
                        null

                });

            }


            // =================================================
            // CREATE SINGLE TASKS
            // =================================================

            for (
                let index = 0;
                index < singleCount;
                index++
            ) {

                tasks.push({

                    ...commonTaskData,

                    taskId:
                        `${requirement.requirementId}-S${index + 1}`,

                    taskType:
                        "single",

                    duration:
                        1,

                    sequence:
                        index + 1,

                    placed:
                        false,

                    periodIds:
                        [],

                    roomId:
                        null

                });

            }

        }
    );


    // ========================================================
    // HARD TASKS FIRST
    // ========================================================
    // Priority:
    //
    // 1. Double lessons
    // 2. Room-required lessons
    // 3. Normal single lessons
    //
    // This is only ordering.
    // Actual intelligent scoring comes later.
    // ========================================================

    tasks.sort(
        (
            a,
            b
        ) => {

            // Double before single
            if (
                a.duration !==
                b.duration
            ) {

                return (
                    b.duration -
                    a.duration
                );

            }


            // Room-required before non-room-required
            if (
                a.requiresRoom !==
                b.requiresRoom
            ) {

                return a.requiresRoom
                    ? -1
                    : 1;

            }


            return 0;

        }
    );


    // ========================================================
    // LOG SUMMARY
    // ========================================================

    const doubleTasks =
        tasks.filter(
            task =>
                task.taskType ===
                "double"
        ).length;


    const singleTasks =
        tasks.filter(
            task =>
                task.taskType ===
                "single"
        ).length;


    const totalPeriods =
        tasks.reduce(
            (
                total,
                task
            ) => {

                return (
                    total +
                    task.duration
                );

            },
            0
        );


    console.log(
        "======================================"
    );

    console.log(
        "LESSON TASK CREATION COMPLETE"
    );

    console.log(
        "======================================"
    );

    console.log(
        "Requirements:",
        requirements.length
    );

    console.log(
        "Total tasks:",
        tasks.length
    );

    console.log(
        "Double tasks:",
        doubleTasks
    );

    console.log(
        "Single tasks:",
        singleTasks
    );

    console.log(
        "Total teaching periods required:",
        totalPeriods
    );

    console.log(
        "======================================"
    );


    console.table(
        tasks.map(
            task => ({

                taskId:
                    task.taskId,

                stream:
                    getTimetableStreamName(
                        lookup.streams.get(
                            task.streamId
                        )
                    ),

                subject:
                    getTimetableSubjectName(
                        lookup.subjects.get(
                            task.subjectId
                        )
                    ),

                teacher:
                    getTimetableTeacherName(
                        task.teacherId
                            ? lookup.teachers.get(
                                task.teacherId
                            )
                            : null
                    ),

                type:
                    task.taskType,

                duration:
                    task.duration,

                roomRequired:
                    task.requiresRoom,

                roomType:
                    task.roomType,

                maxPerDay:
                    task.maxLessonsPerDay

            })
        )
    );


    return tasks;

}




// ============================================================
// VALIDATE LESSON TASKS
// ============================================================

function validateLessonTasks(
    data,
    tasks
) {

    const errors = [];


    if (
        !Array.isArray(tasks)
    ) {

        errors.push(
            "Lesson tasks are not an array."
        );

    }


    if (
        tasks.length === 0
    ) {

        errors.push(
            "No lesson tasks were generated."
        );

    }


    // ========================================================
    // TRACK PERIOD TOTALS BY REQUIREMENT
    // ========================================================

    const requirementTotals =
        new Map();


    const taskIds =
        new Set();


    tasks.forEach(
        task => {

            // ------------------------------------------------
            // TASK ID
            // ------------------------------------------------

            if (
                !task.taskId
            ) {

                errors.push(
                    "A lesson task has no task ID."
                );

            }
            else if (
                taskIds.has(
                    task.taskId
                )
            ) {

                errors.push(

                    `Duplicate lesson task ID: ${task.taskId}`

                );

            }
            else {

                taskIds.add(
                    task.taskId
                );

            }


            // ------------------------------------------------
            // REQUIREMENT
            // ------------------------------------------------

            if (
                !task.requirementId
            ) {

                errors.push(

                    `Task ${task.taskId || "[unknown]"} has no requirement ID.`

                );

            }


            // ------------------------------------------------
            // STREAM
            // ------------------------------------------------

            if (
                !task.streamId
            ) {

                errors.push(

                    `Task ${task.taskId || "[unknown]"} has no stream ID.`

                );

            }


            // ------------------------------------------------
            // SUBJECT
            // ------------------------------------------------

            if (
                !task.subjectId
            ) {

                errors.push(

                    `Task ${task.taskId || "[unknown]"} has no subject ID.`

                );

            }


            // ------------------------------------------------
            // DURATION
            // ------------------------------------------------

            if (
                task.duration !== 1 &&
                task.duration !== 2
            ) {

                errors.push(

                    `Task ${task.taskId || "[unknown]"} has invalid duration ${task.duration}.`

                );

            }


            // ------------------------------------------------
            // TASK TYPE
            // ------------------------------------------------

            if (
                task.taskType !== "single" &&
                task.taskType !== "double"
            ) {

                errors.push(

                    `Task ${task.taskId || "[unknown]"} has invalid task type.`

                );

            }


            // ------------------------------------------------
            // DOUBLE CONSISTENCY
            // ------------------------------------------------

            if (
                task.taskType === "double" &&
                task.duration !== 2
            ) {

                errors.push(

                    `Double task ${task.taskId} must have duration 2.`

                );

            }


            if (
                task.taskType === "single" &&
                task.duration !== 1
            ) {

                errors.push(

                    `Single task ${task.taskId} must have duration 1.`

                );

            }


            // ------------------------------------------------
            // TOTAL BY REQUIREMENT
            // ------------------------------------------------

            if (
                task.requirementId
            ) {

                const current =
                    requirementTotals.get(
                        task.requirementId
                    ) || 0;


                requirementTotals.set(
                    task.requirementId,
                    current +
                    task.duration
                );

            }

        }
    );


    // ========================================================
    // COMPARE WITH REQUIREMENTS
    // ========================================================

    data.requirements.forEach(
        requirement => {

            const expected =
                Number(
                    requirement.lessonsPerWeek
                ) || 0;


            const actual =
                requirementTotals.get(
                    requirement.requirementId
                ) || 0;


            if (
                expected !==
                actual
            ) {

                errors.push(

                    `Requirement ${requirement.requirementId}: ` +

                    `expected ${expected} teaching periods ` +

                    `but generated ${actual}.`

                );

            }

        }
    );


    // ========================================================
    // FINAL RESULT
    // ========================================================

    if (
        errors.length > 0
    ) {

        console.error(
            "LESSON TASK VALIDATION FAILED:",
            errors
        );


        throw new Error(

            "Lesson task validation failed:\n\n" +

            errors.join(
                "\n"
            )

        );

    }


    console.log(
        "Lesson task validation: PASSED"
    );


    return true;

}



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


// ============================================================
// CHECK IF TWO NORMALIZED PERIODS ARE CONSECUTIVE
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


    // ========================================================
    // SAME DAY
    // ========================================================

    if (
        Number(first.dayNumber) !==
        Number(second.dayNumber)
    ) {

        return false;

    }


    // ========================================================
    // PERIOD ORDER
    // ========================================================

    return (

        Number(second.periodOrder) ===
        Number(first.periodOrder) + 1

    );

}




// ============================================================
// SORT PERIODS
// ============================================================


// ============================================================
// SORT NORMALIZED TIMETABLE PERIODS
// ============================================================

function sortTimetablePeriods(
    periods
) {

    if (
        !Array.isArray(periods)
    ) {

        return [];

    }


    return [...periods].sort(
        (
            a,
            b
        ) => {

            const dayA =
                Number(
                    a?.dayNumber
                ) || 0;


            const dayB =
                Number(
                    b?.dayNumber
                ) || 0;


            if (
                dayA !==
                dayB
            ) {

                return dayA - dayB;

            }


            const orderA =
                Number(
                    a?.periodOrder
                ) || 0;


            const orderB =
                Number(
                    b?.periodOrder
                ) || 0;


            return (
                orderA -
                orderB
            );

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
// DAILY REQUIREMENT LESSONS
// ============================================================
//
// IMPORTANT ARCHITECTURAL RULE:
//
// maxLessonsPerDay belongs to a REQUIREMENT.
//
// Example:
//
// Grade 9A + Mathematics
//     maxLessonsPerDay = 2
//
// Grade 9A + Biology
//     maxLessonsPerDay = 2
//
// Grade 9A + English
//     maxLessonsPerDay = 2
//
// These must be tracked independently.
//
// Therefore the key is:
//
// requirement + day
//
// NOT:
//
// stream + day
//
// ============================================================


// ============================================================
// CREATE REQUIREMENT/DAY KEY
// ============================================================

function getDailyRequirementKey(
    requirementId,
    dayNumber
) {

    return (
        `${normalizeTimetableId(requirementId)}__${dayNumber}`
    );

}


// ============================================================
// GET DAILY REQUIREMENT LESSON COUNT
// ============================================================

function getDailyRequirementLessonCount(
    indexes,
    requirementId,
    dayNumber
) {

    if (
        !indexes ||
        !indexes.dailyRequirementLessons
    ) {

        return 0;

    }


    const key =
        getDailyRequirementKey(
            requirementId,
            dayNumber
        );


    return (
        indexes.dailyRequirementLessons.get(
            key
        ) || 0
    );

}


// ============================================================
// INCREMENT DAILY REQUIREMENT LESSON COUNT
// ============================================================

function incrementDailyRequirementLessonCount(
    indexes,
    requirementId,
    dayNumber,
    amount = 1
) {

    if (
        !indexes ||
        !indexes.dailyRequirementLessons
    ) {

        return;

    }


    const key =
        getDailyRequirementKey(
            requirementId,
            dayNumber
        );


    const currentCount =
        getDailyRequirementLessonCount(
            indexes,
            requirementId,
            dayNumber
        );


    indexes.dailyRequirementLessons.set(
        key,
        currentCount + amount
    );

}





// ============================================================
// CREATE OCCUPANCY INDEXES
// ============================================================

// ============================================================
// CREATE OCCUPANCY INDEXES
// ============================================================

function createOccupancyIndexes(
    data = null
) {

    const indexes = {

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
        // REQUIREMENT / DAY
        // ----------------------------------------------------

        dailyRequirementLessons:
            new Map(),


        // ----------------------------------------------------
        // NORMALIZED PERIODS
        // ----------------------------------------------------
        //
        // Used by teacher consecutive-lesson validation.
        //
        // ----------------------------------------------------

        periods:
            Array.isArray(
                data?.periods
            )
                ? data.periods
                : [],


        // ----------------------------------------------------
        // TEACHER WORKLOAD LIMITS
        // ----------------------------------------------------
        //
        // Stores:
        //
        //     maxLessonsPerDay
        //     maxLessonsPerWeek
        //     maxConsecutiveLessons
        //
        // These are used by hard-placement validation.
        //
        // ----------------------------------------------------

        teacherLimits:
            new Map()

    };


    // ========================================================
    // BUILD TEACHER LIMIT MAP
    // ========================================================

    if (
        Array.isArray(
            data?.teachers
        )
    ) {

        data.teachers.forEach(
            teacher => {

                const teacherId =
                    normalizeTimetableId(
                        teacher?.id
                    );


                if (
                    !teacherId
                ) {

                    return;

                }


                indexes.teacherLimits.set(
                    teacherId,
                    {

                        maxLessonsPerDay:
                            Number(
                                teacher.maxLessonsPerDay
                            ) || 0,

                        maxLessonsPerWeek:
                            Number(
                                teacher.maxLessonsPerWeek
                            ) || 0,

                        maxConsecutiveLessons:
                            Number(
                                teacher.maxConsecutiveLessons
                            ) || 0

                    }
                );

            }
        );

    }


    return indexes;

}









// ============================================================
// GET TEACHER MAX CONSECUTIVE LESSONS
// ============================================================

function getTeacherMaxConsecutiveLessons(
    indexes,
    teacherId
) {

    if (
        !indexes ||
        !indexes.teacherLimits ||
        !teacherId
    ) {

        return 0;

    }


    const normalizedTeacherId =
        normalizeTimetableId(
            teacherId
        );


    const limits =
        indexes.teacherLimits.get(
            normalizedTeacherId
        );


    return Number(
        limits?.maxConsecutiveLessons
    ) || 0;

}


// ============================================================
// GET PERIOD BY ID FROM OCCUPANCY INDEXES
// ============================================================

function getIndexedPeriod(
    indexes,
    periodId
) {

    if (
        !indexes ||
        !Array.isArray(indexes.periods) ||
        !periodId
    ) {

        return null;

    }


    const normalizedPeriodId =
        normalizeTimetableId(
            periodId
        );


    return (
        indexes.periods.find(
            period =>
                normalizeTimetableId(
                    period?.id
                ) ===
                normalizedPeriodId
        ) ||
        null
    );

}


// ============================================================
// GET TEACHER'S CURRENT PERIODS
// ============================================================

function getTeacherOccupiedPeriods(
    indexes,
    teacherId
) {

    if (
        !indexes ||
        !indexes.teacherPeriod ||
        !teacherId
    ) {

        return [];

    }


    const normalizedTeacherId =
        normalizeTimetableId(
            teacherId
        );


    const prefix =
        `${normalizedTeacherId}__`;


    const periods = [];


    indexes.teacherPeriod.forEach(
        key => {

            if (
                !key.startsWith(
                    prefix
                )
            ) {

                return;

            }


            const periodId =
                key.substring(
                    prefix.length
                );


            const period =
                getIndexedPeriod(
                    indexes,
                    periodId
                );


            if (
                period
            ) {

                periods.push(
                    period
                );

            }

        }
    );


    return periods;

}


// ============================================================
// CALCULATE LONGEST CONSECUTIVE PERIOD RUN
// ============================================================
//
// Returns the longest sequence of consecutive teaching
// periods for the supplied periods.
//
// Consecutive means:
//
//     same day
//     AND
//     next periodOrder = previous periodOrder + 1
//
// This intentionally uses the SAME definition as:
//
//     arePeriodsConsecutive()
//
// ============================================================

function calculateLongestConsecutivePeriodRun(
    periods
) {

    if (
        !Array.isArray(periods) ||
        periods.length === 0
    ) {

        return 0;

    }


    const dayGroups =
        new Map();


    // ========================================================
    // GROUP BY DAY
    // ========================================================

    periods.forEach(
        period => {

            if (
                !period
            ) {

                return;

            }


            const dayNumber =
                Number(
                    period.dayNumber
                );


            const periodOrder =
                Number(
                    period.periodOrder
                );


            if (
                !Number.isFinite(dayNumber) ||
                !Number.isFinite(periodOrder)
            ) {

                return;

            }


            if (
                !dayGroups.has(
                    dayNumber
                )
            ) {

                dayGroups.set(
                    dayNumber,
                    []
                );

            }


            dayGroups.get(
                dayNumber
            ).push(
                periodOrder
            );

        }
    );


    let longestRun =
        0;


    // ========================================================
    // ANALYSE EACH DAY
    // ========================================================

    dayGroups.forEach(
        orders => {

            // ------------------------------------------------
            // REMOVE DUPLICATES
            // ------------------------------------------------

            const uniqueOrders =
                [
                    ...new Set(
                        orders
                    )
                ]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        a - b
                );


            if (
                uniqueOrders.length === 0
            ) {

                return;

            }


            let currentRun =
                1;


            let dayLongestRun =
                1;


            // ------------------------------------------------
            // FIND LONGEST CONSECUTIVE RUN
            // ------------------------------------------------

            for (
                let i = 1;
                i < uniqueOrders.length;
                i++
            ) {

                if (
                    uniqueOrders[i] ===
                    uniqueOrders[i - 1] + 1
                ) {

                    currentRun++;

                }
                else {

                    currentRun = 1;

                }


                dayLongestRun =
                    Math.max(
                        dayLongestRun,
                        currentRun
                    );

            }


            longestRun =
                Math.max(
                    longestRun,
                    dayLongestRun
                );

        }
    );


    return longestRun;

}


// ============================================================
// CHECK TEACHER CONSECUTIVE LIMIT
// ============================================================
//
// Returns:
//
//     true
//         if placing the candidate period(s) WOULD exceed
//         the teacher's maximum consecutive lesson limit.
//
//     false
//         if the limit would not be exceeded.
//
// ============================================================

function wouldExceedTeacherConsecutiveLimit(
    task,
    candidatePeriods,
    indexes
) {

    if (
        !task ||
        !Array.isArray(candidatePeriods) ||
        candidatePeriods.length === 0 ||
        !indexes
    ) {

        return false;

    }


    const teacherId =
        normalizeTimetableId(
            task.teacherId
        );


    // --------------------------------------------------------
    // No teacher = no teacher consecutive constraint.
    // --------------------------------------------------------

    if (
        !teacherId
    ) {

        return false;

    }


    const maximum =
        getTeacherMaxConsecutiveLessons(
            indexes,
            teacherId
        );


    // --------------------------------------------------------
    // No configured limit = no hard constraint.
    // --------------------------------------------------------

    if (
        maximum <= 0
    ) {

        return false;

    }


    // ========================================================
    // CURRENT TEACHER PERIODS
    // ========================================================

    const occupiedPeriods =
        getTeacherOccupiedPeriods(
            indexes,
            teacherId
        );


    // ========================================================
    // PROJECTED TEACHER PERIODS
    // ========================================================
    //
    // Add the candidate period(s) to the currently occupied
    // periods.
    //
    // No duplicate period IDs are added.
    //
    // ========================================================

    const projectedPeriodMap =
        new Map();


    occupiedPeriods.forEach(
        period => {

            projectedPeriodMap.set(
                normalizeTimetableId(
                    period.id
                ),
                period
            );

        }
    );


    candidatePeriods.forEach(
        period => {

            if (
                !period
            ) {

                return;

            }


            projectedPeriodMap.set(
                normalizeTimetableId(
                    period.id
                ),
                period
            );

        }
    );


    const projectedPeriods =
        [
            ...projectedPeriodMap.values()
        ];


    // ========================================================
    // CALCULATE PROJECTED LONGEST RUN
    // ========================================================

    const longestRun =
        calculateLongestConsecutivePeriodRun(
            projectedPeriods
        );


    return (
        longestRun >
        maximum
    );

}


// ============================================================
// GET TEACHER CONSECUTIVE CONFLICT REASON
// ============================================================

function getTeacherConsecutiveConflictReason(
    task,
    indexes
) {

    const maximum =
        getTeacherMaxConsecutiveLessons(
            indexes,
            task?.teacherId
        );


    if (
        maximum <= 0
    ) {

        return "";
    }


    return (

        `Teacher would exceed the maximum of ` +
        `${maximum} consecutive lessons.`

    );

}

// ============================================================
// CHECK SINGLE SLOT CONFLICT
// ============================================================

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
    // TEACHER CONSECUTIVE LESSON LIMIT
    // ========================================================

    if (
        teacherId
    ) {

        const wouldExceedConsecutive =
            wouldExceedTeacherConsecutiveLimit(
                task,
                [
                    period
                ],
                indexes
            );


        if (
            wouldExceedConsecutive
        ) {

            return {

                valid:
                    false,

                reason:
                    getTeacherConsecutiveConflictReason(
                        task,
                        indexes
                    )

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
    // REQUIREMENT DAILY LIMIT
    // ========================================================

    const requirementId =
        normalizeTimetableId(
            task.requirementId
        );


    const maxPerDay =
        Number(
            task.maxLessonsPerDay
        ) || 0;


    if (
        requirementId &&
        maxPerDay > 0
    ) {

        const currentCount =
            getDailyRequirementLessonCount(
                indexes,
                requirementId,
                period.dayNumber
            );


        if (
            currentCount >=
            maxPerDay
        ) {

            return {

                valid:
                    false,

                reason:
                    "Maximum daily lessons reached for this requirement."

            };

        }

    }


    // ========================================================
    // SLOT IS AVAILABLE
    // ========================================================

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
// Reserves ONE timetable period for a lesson task.
//
// IMPORTANT:
// - A single lesson calls this once.
// - A double lesson must call this twice,
//   once for each consecutive period.
//
// Daily limits are tracked by:
//     requirement + day
//
// NOT:
//     stream + day
//
// Therefore:
//
// Grade 9A Mathematics Monday = 2
// Grade 9A Biology Monday     = 2
//
// can coexist correctly.
// ============================================================

function reserveSlot(
    task,
    period,
    room,
    indexes
) {

    // ========================================================
    // BASIC SAFETY
    // ========================================================

    if (
        !task ||
        !period ||
        !indexes
    ) {

        console.warn(
            "reserveSlot: Missing task, period or indexes."
        );

        return false;

    }


    // ========================================================
    // NORMALIZED IDs
    // ========================================================

    const streamId =
        normalizeTimetableId(
            task.streamId
        );


    const periodId =
        normalizeTimetableId(
            period.id
        );


    const requirementId =
        normalizeTimetableId(
            task.requirementId
        );


    // ========================================================
    // STREAM / PERIOD
    // ========================================================
    // Prevents the same stream from having two lessons
    // in the same period.
    // ========================================================

    indexes.streamPeriod.add(
        `${streamId}__${periodId}`
    );


    // ========================================================
    // TEACHER / PERIOD
    // ========================================================
    // Prevents the same teacher from teaching two streams
    // in the same period.
    // ========================================================

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


    // ========================================================
    // ROOM / PERIOD
    // ========================================================
    // Prevents the same room from being used by two lessons
    // in the same period.
    // ========================================================

    if (
        room &&
        room.id
    ) {

        const roomId =
            normalizeTimetableId(
                room.id
            );


        indexes.roomPeriod.add(
            `${roomId}__${periodId}`
        );

    }


    // ========================================================
    // REQUIREMENT / DAY
    // ========================================================
    // maxLessonsPerDay belongs to the requirement.
    //
    // Example:
    //
    // Mathematics requirement:
    //     Monday = 2
    //
    // Biology requirement:
    //     Monday = 2
    //
    // These are tracked independently.
    //
    // IMPORTANT:
    // This function reserves ONE physical timetable period.
    // Therefore a double lesson must call reserveSlot()
    // twice, once for each period.
    // ========================================================

    if (
        requirementId
    ) {

        const dayNumber =
            Number(
                period.dayNumber
            );


        if (
            Number.isFinite(
                dayNumber
            )
        ) {

            incrementDailyRequirementLessonCount(
                indexes,
                requirementId,
                dayNumber,
                1
            );

        }
        else {

            console.warn(
                "reserveSlot: Period has no valid day number.",
                {
                    taskId:
                        task.taskId,

                    periodId:
                        periodId,

                    dayNumber:
                        period.dayNumber
                }
            );

        }

    }


    // ========================================================
    // SUCCESS
    // ========================================================

    return true;

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
// STAGE 4 — DOUBLE LESSON PLACEMENT
// ============================================================
//
// Finds valid pairs of consecutive teaching periods.
//
// A double lesson requires:
//
//     PERIOD 1
//     PERIOD 2
//
// Both must:
//
// - belong to the same day
// - be teaching periods
// - be consecutive according to periodOrder
//
// ============================================================


// ============================================================
// GET CONSECUTIVE TEACHING PERIOD PAIRS
// ============================================================

function getConsecutiveTeachingPeriodPairs(
    periods
) {

    if (
        !Array.isArray(periods)
    ) {

        return [];

    }


    // ========================================================
    // ONLY TEACHING PERIODS
    // ========================================================

    const teachingPeriods =
        getTeachingPeriods(
            periods
        );


    if (
        teachingPeriods.length < 2
    ) {

        return [];

    }


    // ========================================================
    // SORT PERIODS
    // ========================================================

    const sortedPeriods =
        sortTimetablePeriods(
            teachingPeriods
        );


    const pairs = [];


    // ========================================================
    // FIND CONSECUTIVE PAIRS
    // ========================================================

    for (
        let i = 0;
        i < sortedPeriods.length - 1;
        i++
    ) {

        const firstPeriod =
            sortedPeriods[i];


        const secondPeriod =
            sortedPeriods[i + 1];


        // ----------------------------------------------------
        // MUST BE CONSECUTIVE
        // ----------------------------------------------------

        if (
            !arePeriodsConsecutive(
                firstPeriod,
                secondPeriod
            )
        ) {

            continue;

        }


        pairs.push({

            first:
                firstPeriod,

            second:
                secondPeriod

        });

    }


    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
        "Consecutive teaching period pairs:",
        pairs.length
    );


    return pairs;

}

// ============================================================
// CHECK DOUBLE LESSON CONFLICT
// ============================================================
//
// Checks BOTH periods of a double lesson.
//
// A double lesson is valid only if both periods are free.
//
// ============================================================

// ============================================================
// CHECK DOUBLE LESSON CONFLICT
// ============================================================
//
// Checks BOTH periods of a double lesson.
//
// A double lesson is valid only if:
//
// - the periods are consecutive
// - the stream is free in both periods
// - the teacher is free in both periods
// - the teacher consecutive limit is respected
// - the room is free in both periods
// - the requirement daily limit is respected
//
// ============================================================

function checkDoubleLessonConflict(
    task,
    firstPeriod,
    secondPeriod,
    room,
    indexes
) {

    if (
        !task ||
        !firstPeriod ||
        !secondPeriod ||
        !indexes
    ) {

        return {

            valid:
                false,

            reason:
                "Invalid double lesson placement data."

        };

    }


    // ========================================================
    // VERIFY CONSECUTIVE PERIODS
    // ========================================================

    if (
        !arePeriodsConsecutive(
            firstPeriod,
            secondPeriod
        )
    ) {

        return {

            valid:
                false,

            reason:
                "The two periods are not consecutive."

        };

    }


    // ========================================================
    // CHECK FIRST PERIOD
    // ========================================================

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

        return {

            valid:
                false,

            reason:
                `First period unavailable: ${firstCheck.reason}`

        };

    }


    // ========================================================
    // IMPORTANT DAILY LIMIT CHECK
    // ========================================================
    //
    // A double lesson occupies TWO periods.
    //
    // Therefore checking the second period against the
    // original occupancy index is not enough.
    //
    // We calculate the requirement's daily usage before
    // this double lesson.
    //
    // ========================================================

    const requirementId =
        normalizeTimetableId(
            task.requirementId
        );


    const maxPerDay =
        Number(
            task.maxLessonsPerDay
        ) || 0;


    if (
        requirementId &&
        maxPerDay > 0
    ) {

        const dayNumber =
            Number(
                firstPeriod.dayNumber
            );


        const currentCount =
            getDailyRequirementLessonCount(
                indexes,
                requirementId,
                dayNumber
            );


        if (
            currentCount + 2 >
            maxPerDay
        ) {

            return {

                valid:
                    false,

                reason:
                    "Double lesson would exceed the requirement daily limit."

            };

        }

    }


    // ========================================================
    // CHECK SECOND PERIOD
    // ========================================================
    //
    // The first period has already passed
    // checkSingleSlotConflict().
    //
    // The second period must now be checked independently.
    //
    // ========================================================

    const streamId =
        normalizeTimetableId(
            task.streamId
        );


    const secondPeriodId =
        normalizeTimetableId(
            secondPeriod.id
        );


    // ========================================================
    // STREAM
    // ========================================================

    const streamKey =
        `${streamId}__${secondPeriodId}`;


    if (
        indexes.streamPeriod.has(
            streamKey
        )
    ) {

        return {

            valid:
                false,

            reason:
                "Stream is already occupied in the second period."

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
            `${teacherId}__${secondPeriodId}`;


        if (
            indexes.teacherPeriod.has(
                teacherKey
            )
        ) {

            return {

                valid:
                    false,

                reason:
                    "Teacher is already occupied in the second period."

            };

        }

    }


    // ========================================================
    // TEACHER CONSECUTIVE LESSON LIMIT
    // ========================================================
    //
    // IMPORTANT:
    //
    // A double lesson occupies TWO consecutive periods.
    //
    // Therefore we must evaluate BOTH candidate periods
    // together against the teacher's existing timetable.
    //
    // ========================================================

    if (
        teacherId
    ) {

        const wouldExceedConsecutive =
            wouldExceedTeacherConsecutiveLimit(
                task,
                [
                    firstPeriod,
                    secondPeriod
                ],
                indexes
            );


        if (
            wouldExceedConsecutive
        ) {

            return {

                valid:
                    false,

                reason:
                    getTeacherConsecutiveConflictReason(
                        task,
                        indexes
                    )

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
            `${normalizeTimetableId(room.id)}__${secondPeriodId}`;


        if (
            indexes.roomPeriod.has(
                roomKey
            )
        ) {

            return {

                valid:
                    false,

                reason:
                    "Room is already occupied in the second period."

            };

        }

    }


    // ========================================================
    // VALID
    // ========================================================

    return {

        valid:
            true,

        reason:
            ""

    };

}

// ============================================================
// PLACE ONE DOUBLE LESSON
// ============================================================

function placeDoubleLesson(
    task,
    periods,
    rooms,
    indexes
) {

    if (
        !task ||
        task.taskType !== "double"
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Invalid double lesson task."

        };

    }


    const pairs =
        getConsecutiveTeachingPeriodPairs(
            periods
        );


    if (
        pairs.length === 0
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "No consecutive teaching period pairs are available."

        };

    }


    // ========================================================
    // SHUFFLE CANDIDATES
    // ========================================================

    const candidatePairs =
        shuffleArray(
            pairs
        );


    // ========================================================
    // TRY EACH PERIOD PAIR
    // ========================================================

    for (
        const pair of candidatePairs
    ) {

        const compatibleRooms =
            getCompatibleRooms(
                task,
                rooms
            );


        if (
            compatibleRooms.length === 0
        ) {

            continue;

        }


        // ====================================================
        // TRY EACH ROOM
        // ====================================================

        for (
            const room of compatibleRooms
        ) {

            const conflict =
                checkDoubleLessonConflict(
                    task,
                    pair.first,
                    pair.second,
                    room,
                    indexes
                );


            if (
                !conflict.valid
            ) {

                continue;

            }


            // ==================================================
            // RESERVE BOTH PERIODS
            // ==================================================

            reserveSlot(
                task,
                pair.first,
                room,
                indexes
            );


            reserveSlot(
                task,
                pair.second,
                room,
                indexes
            );


            // ==================================================
            // CREATE BOTH ENTRIES
            // ==================================================

            const firstEntry =
                createGeneratedEntry(
                    task,
                    pair.first,
                    room
                );


            const secondEntry =
                createGeneratedEntry(
                    task,
                    pair.second,
                    room
                );


            // ==================================================
            // MARK TASK AS PLACED
            // ==================================================

            task.placed =
                true;


            task.periodIds =
                [
                    pair.first.id,
                    pair.second.id
                ];


            task.roomId =
                room?.id ||
                null;


            // ==================================================
            // SUCCESS
            // ==================================================

            console.log(
                "DOUBLE LESSON PLACED:",
                {
                    taskId:
                        task.taskId,

                    firstPeriod:
                        pair.first.id,

                    secondPeriod:
                        pair.second.id,

                    roomId:
                        room?.id ||
                        null
                }
            );


            return {

                placed:
                    true,

                entries:
                    [
                        firstEntry,
                        secondEntry
                    ],

                reason:
                    ""

            };

        }

    }


    // ========================================================
    // FAILED
    // ========================================================

    console.warn(
        "DOUBLE LESSON COULD NOT BE PLACED:",
        {
            taskId:
                task.taskId,

            streamId:
                task.streamId,

            subjectId:
                task.subjectId
        }
    );


    return {

        placed:
            false,

        entries:
            [],

        reason:
            "No valid consecutive period pair was found."

    };

}




// ============================================================
// STAGE 5 — SINGLE LESSON PLACEMENT
// ============================================================
//
// Places ONE normal lesson into ONE teaching period.
//
// A single lesson requires:
//
// - one valid teaching period
// - one compatible room (when required)
// - no stream conflict
// - no teacher conflict
// - no room conflict
// - no daily requirement-limit violation
//
// The function uses the existing:
//
//     checkSingleSlotConflict()
//     getTeachingPeriods()
//     getCompatibleRooms()
//     shuffleArray()
//     reserveSlot()
//     createGeneratedEntry()
//
// ============================================================


// ============================================================
// PLACE ONE SINGLE LESSON
// ============================================================

function placeSingleLesson(
    task,
    periods,
    rooms,
    indexes
) {

    // ========================================================
    // VALIDATE INPUT
    // ========================================================

    if (
        !task ||
        !Array.isArray(periods) ||
        !Array.isArray(rooms) ||
        !indexes
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Invalid single lesson placement data."

        };

    }


    // ========================================================
    // TASK TYPE
    // ========================================================
    //
    // This function is ONLY for normal single lessons.
    //
    // Double lessons must go through:
    //
    //     placeDoubleLesson()
    //
    // ========================================================

    if (
        task.taskType &&
        task.taskType !== "single"
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Task is not a single lesson."

        };

    }


    // ========================================================
    // GET TEACHING PERIODS
    // ========================================================

    const teachingPeriods =
        getTeachingPeriods(
            periods
        );


    if (
        teachingPeriods.length === 0
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "No teaching periods are available."

        };

    }


    // ========================================================
    // GET COMPATIBLE ROOMS
    // ========================================================
    //
    // We calculate compatible rooms once rather than
    // repeatedly for every period.
    //
    // ========================================================

    const compatibleRooms =
        getCompatibleRooms(
            task,
            rooms
        );


    // ========================================================
    // ROOM REQUIREMENT
    // ========================================================
    //
    // If the task requires a room but no compatible room
    // exists, placement is impossible.
    //
    // ========================================================

    const requiresRoom =
        Boolean(
            task.requiresRoom
        );


    if (
        requiresRoom &&
        compatibleRooms.length === 0
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "No compatible room is available for this lesson."

        };

    }


    // ========================================================
    // CANDIDATE PERIODS
    // ========================================================
    //
    // Shuffle periods so the generator does not always
    // produce the same timetable.
    //
    // ========================================================

    const candidatePeriods =
        shuffleArray(
            teachingPeriods
        );


    // ========================================================
    // TRY EACH PERIOD
    // ========================================================

    for (
        const period of candidatePeriods
    ) {


        // ====================================================
        // ROOM OPTIONS
        // ====================================================
        //
        // If a room is not required, we still try a null room.
        //
        // If a room IS required, we try every compatible room.
        //
        // ====================================================

        const candidateRooms =
            requiresRoom
                ? shuffleArray(
                    compatibleRooms
                )
                : [null];


        // ====================================================
        // TRY EACH ROOM
        // ====================================================

        for (
            const room of candidateRooms
        ) {


            // ==================================================
            // CHECK CONFLICTS
            // ==================================================

            const conflict =
                checkSingleSlotConflict(
                    task,
                    period,
                    room,
                    indexes
                );


            // ==================================================
            // SLOT NOT VALID
            // ==================================================

            if (
                !conflict ||
                !conflict.valid
            ) {

                continue;

            }


            // ==================================================
            // RESERVE SLOT
            // ==================================================
            //
            // IMPORTANT:
            //
            // The slot is reserved ONLY after all validation
            // has passed.
            //
            // ==================================================

            reserveSlot(
                task,
                period,
                room,
                indexes
            );


            // ==================================================
            // CREATE GENERATED ENTRY
            // ==================================================

            const entry =
                createGeneratedEntry(
                    task,
                    period,
                    room
                );


            // ==================================================
            // MARK TASK AS PLACED
            // ==================================================

            task.placed =
                true;


            task.periodIds =
                [
                    period.id
                ];


            task.roomId =
                room?.id ||
                null;


            // ==================================================
            // DEBUG
            // ==================================================

            console.log(
                "SINGLE LESSON PLACED:",
                {

                    taskId:
                        task.taskId,

                    streamId:
                        task.streamId,

                    subjectId:
                        task.subjectId,

                    teacherId:
                        task.teacherId,

                    periodId:
                        period.id,

                    roomId:
                        room?.id ||
                        null

                }
            );


            // ==================================================
            // SUCCESS
            // ==================================================

            return {

                placed:
                    true,

                entries:
                    [
                        entry
                    ],

                reason:
                    ""

            };

        }

    }


    // ========================================================
    // FAILED
    // ========================================================

    console.warn(
        "SINGLE LESSON COULD NOT BE PLACED:",
        {

            taskId:
                task.taskId,

            streamId:
                task.streamId,

            subjectId:
                task.subjectId,

            teacherId:
                task.teacherId

        }
    );


    return {

        placed:
            false,

        entries:
            [],

        reason:
            "No valid period and room combination was found."

    };

}

// ============================================================
// STAGE 6A — INTELLIGENT TASK PRIORITY
// ============================================================
//
// Determines which lesson tasks should be scheduled first.
//
// IMPORTANT:
//
// This function works with the ACTUAL task structure created
// by createLessonTasks().
//
// It does NOT assume that every task contains:
//
//     lessonsPerWeek
//
// because lessonsPerWeek belongs to the requirement.
//
// ============================================================


// ============================================================
// GET REQUIREMENT FOR TASK
// ============================================================

function getTaskRequirement(
    task,
    lookup
) {

    if (
        !task ||
        !lookup ||
        !lookup.requirements
    ) {

        return null;

    }


    return (
        lookup.requirements.get(
            task.requirementId
        ) ||
        null
    );

}


// ============================================================
// COUNT COMPATIBLE ROOMS
// ============================================================

function getTaskCompatibleRoomCount(
    task,
    rooms
) {

    if (
        !task ||
        !task.requiresRoom
    ) {

        // No room restriction means the task is flexible.
        return Infinity;

    }


    return getCompatibleRooms(
        task,
        rooms
    ).length;

}


// ============================================================
// GET TASK PRIORITY SCORE
// ============================================================

function getTaskPriorityScore(
    task,
    rooms,
    lookup
) {

    if (
        !task
    ) {

        return -Infinity;

    }


    let score = 0;


    // ========================================================
    // 1. DOUBLE LESSON
    // ========================================================
    //
    // A double lesson needs TWO consecutive periods.
    //
    // This is substantially more restrictive than a normal
    // single lesson.
    //
    // ========================================================

    if (
        task.taskType === "double"
    ) {

        score += 1000;

    }


    // ========================================================
    // 2. ROOM REQUIRED
    // ========================================================

    if (
        task.requiresRoom
    ) {

        score += 500;

    }


    // ========================================================
    // 3. SPECIALIZED ROOM
    // ========================================================
    //
    // A task requiring a specific room type is more
    // restrictive than one that can use any room.
    //
    // ========================================================

    if (
        normalizeRoomType(
            task.roomType
        )
    ) {

        score += 300;

    }


    // ========================================================
    // 4. NUMBER OF COMPATIBLE ROOMS
    // ========================================================
    //
    // Fewer rooms = more restrictive.
    //
    // Example:
    //
    // Biology → 1 laboratory
    // Computer → 2 computer labs
    // Ordinary lesson → unlimited classroom choice
    //
    // Biology should go first.
    //
    // ========================================================

    const compatibleRoomCount =
        getTaskCompatibleRoomCount(
            task,
            rooms
        );


    if (
        task.requiresRoom
    ) {

        if (
            compatibleRoomCount === 0
        ) {

            // ------------------------------------------------
            // Impossible task gets very high priority.
            //
            // This allows the generator to expose the
            // impossible requirement early.
            // ------------------------------------------------

            score += 5000;

        }
        else {

            score += Math.max(
                0,
                300 -
                (
                    compatibleRoomCount *
                    50
                )
            );

        }

    }


    // ========================================================
    // 5. MAX LESSONS PER DAY
    // ========================================================
    //
    // A requirement allowing only one lesson per day is
    // more restrictive than one allowing three.
    //
    // ========================================================

    const maxPerDay =
        Number(
            task.maxLessonsPerDay
        ) || 0;


    if (
        maxPerDay === 1
    ) {

        score += 200;

    }
    else if (
        maxPerDay === 2
    ) {

        score += 100;

    }
    else if (
        maxPerDay === 3
    ) {

        score += 50;

    }


    // ========================================================
    // 6. WEEKLY FREQUENCY
    // ========================================================
    //
    // Retrieve the requirement because lessonsPerWeek lives
    // there rather than directly on the task.
    //
    // ========================================================

    const requirement =
        getTaskRequirement(
            task,
            lookup
        );


    const lessonsPerWeek =
        Number(
            requirement?.lessonsPerWeek
        ) || 0;


    // More weekly lessons = more scheduling pressure.
    score += Math.min(
        lessonsPerWeek * 20,
        200
    );


    // ========================================================
    // 7. DOUBLE LESSONS PER WEEK
    // ========================================================
    //
    // Requirements with multiple doubles have greater
    // consecutive-period pressure.
    //
    // ========================================================

    const doubleLessonsPerWeek =
        Number(
            requirement?.doubleLessonsPerWeek
        ) || 0;


    score += Math.min(
        doubleLessonsPerWeek * 50,
        200
    );


    // ========================================================
    // FINAL SCORE
    // ========================================================

    return score;

}


// ============================================================
// SORT TASKS FOR SCHEDULING
// ============================================================
//
// Returns a NEW array.
//
// The original lessonTasks array remains untouched.
//
// ============================================================

function sortTasksForScheduling(
    tasks,
    rooms,
    lookup
) {

    if (
        !Array.isArray(tasks)
    ) {

        return [];

    }


    const sortedTasks =
        [...tasks];


    sortedTasks.sort(
        (
            a,
            b
        ) => {

            const scoreA =
                getTaskPriorityScore(
                    a,
                    rooms,
                    lookup
                );


            const scoreB =
                getTaskPriorityScore(
                    b,
                    rooms,
                    lookup
                );


            // ------------------------------------------------
            // PRIMARY PRIORITY
            // ------------------------------------------------

            if (
                scoreA !==
                scoreB
            ) {

                return (
                    scoreB -
                    scoreA
                );

            }


            // ------------------------------------------------
            // DOUBLE FIRST
            // ------------------------------------------------

            if (
                a.duration !==
                b.duration
            ) {

                return (
                    b.duration -
                    a.duration
                );

            }


            // ------------------------------------------------
            // ROOM REQUIRED FIRST
            // ------------------------------------------------

            if (
                a.requiresRoom !==
                b.requiresRoom
            ) {

                return a.requiresRoom
                    ? -1
                    : 1;

            }


            // ------------------------------------------------
            // RANDOM TIE BREAKER
            // ------------------------------------------------
            //
            // Only used when tasks are otherwise equivalent.
            //
            // This prevents every generated timetable from
            // following exactly the same task order.
            //
            // ------------------------------------------------

            return (
                Math.random() -
                0.5
            );

        }
    );


    // ========================================================
    // DEBUG SUMMARY
    // ========================================================

    console.log(
        "======================================"
    );

    console.log(
        "TASK SCHEDULING PRIORITY"
    );

    console.log(
        "======================================"
    );


    console.table(
        sortedTasks.map(
            task => ({

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

                taskType:
                    task.taskType,

                duration:
                    task.duration,

                requiresRoom:
                    task.requiresRoom,

                roomType:
                    task.roomType,

                maxLessonsPerDay:
                    task.maxLessonsPerDay,

                priority:
                    getTaskPriorityScore(
                        task,
                        rooms,
                        lookup
                    )

            })
        )
    );


    return sortedTasks;

}

// ============================================================
// STAGE 6B — SMART TASK PRIORITY
// ============================================================
//
// Determines which lesson tasks should be placed first.
//
// The principle is:
//
//     MOST RESTRICTED / MOST DIFFICULT
//                 ↓
//             FIRST
//
// This prevents easy lessons from consuming slots that
// difficult lessons need later.
//
// Priority factors include:
//
// 1. Double lesson
// 2. Room-required lesson
// 3. Specific room type
// 4. Teacher restrictions
// 5. High weekly lesson count
// 6. Low daily limit
//
// IMPORTANT:
// This function DOES NOT place anything.
//
// It only calculates a priority score.
// ============================================================


// ============================================================
// CALCULATE TASK PRIORITY SCORE
// ============================================================

function calculateTaskPriorityScore(
    task,
    data
) {

    if (
        !task ||
        !data
    ) {

        return 0;

    }


    let score = 0;


    // ========================================================
    // 1. DOUBLE LESSON
    // ========================================================
    //
    // Double lessons are harder to place because they need
    // TWO consecutive free periods.
    //
    // Therefore they receive the highest base priority.
    //
    // ========================================================

    if (
        task.taskType === "double"
    ) {

        score += 100;

    }


    // ========================================================
    // 2. ROOM REQUIRED
    // ========================================================
    //
    // A lesson requiring a room has fewer possible slots.
    //
    // ========================================================

    if (
        task.requiresRoom
    ) {

        score += 50;

    }


    // ========================================================
    // 3. SPECIFIC ROOM TYPE
    // ========================================================
    //
    // Example:
    //
    // Laboratory
    // Computer Lab
    // Workshop
    //
    // A specific room type makes placement more restrictive.
    //
    // ========================================================

    if (
        task.roomType
    ) {

        score += 25;

    }


    // ========================================================
    // 4. TEACHER ASSIGNED
    // ========================================================
    //
    // A teacher creates another occupancy constraint.
    //
    // ========================================================

    if (
        task.teacherId
    ) {

        score += 15;

    }


    // ========================================================
    // 5. DAILY LIMIT
    // ========================================================
    //
    // A low daily limit makes the task more restrictive.
    //
    // Example:
    //
    // maxPerDay = 1
    //     → highly restrictive
    //
    // maxPerDay = 4
    //     → less restrictive
    //
    // ========================================================

    const maxPerDay =
        Number(
            task.maxLessonsPerDay
        ) || 0;


    if (
        maxPerDay === 1
    ) {

        score += 35;

    }
    else if (
        maxPerDay === 2
    ) {

        score += 20;

    }
    else if (
        maxPerDay === 3
    ) {

        score += 10;

    }


    // ========================================================
    // 6. TASK DURATION
    // ========================================================
    //
    // Longer tasks consume more timetable space.
    //
    // ========================================================

    if (
        Number(task.duration) === 2
    ) {

        score += 20;

    }


    // ========================================================
    // FINAL SCORE
    // ========================================================

    return score;

}


// ============================================================
// SORT LESSON TASKS BY DIFFICULTY
// ============================================================
//
// Returns a NEW array.
//
// The original lessonTasks array is not modified.
//
// ============================================================

function sortLessonTasksByPriority(
    tasks,
    data
) {

    if (
        !Array.isArray(tasks)
    ) {

        return [];

    }


    const sorted =
        tasks.map(
            task => ({

                task,

                priority:
                    calculateTaskPriorityScore(
                        task,
                        data
                    )

            })
        );


    // ========================================================
    // SORT HIGHEST PRIORITY FIRST
    // ========================================================

    sorted.sort(
        (
            a,
            b
        ) => {

            if (
                b.priority !==
                a.priority
            ) {

                return (
                    b.priority -
                    a.priority
                );

            }


            // ------------------------------------------------
            // TIE BREAKER 1 — DOUBLE FIRST
            // ------------------------------------------------

            if (
                a.task.duration !==
                b.task.duration
            ) {

                return (
                    b.task.duration -
                    a.task.duration
                );

            }


            // ------------------------------------------------
            // TIE BREAKER 2 — ROOM REQUIRED
            // ------------------------------------------------

            if (
                a.task.requiresRoom !==
                b.task.requiresRoom
            ) {

                return a.task.requiresRoom
                    ? -1
                    : 1;

            }


            // ------------------------------------------------
            // TIE BREAKER 3 — RANDOM
            // ------------------------------------------------
            //
            // Prevents exactly the same timetable every time
            // when tasks have equal priority.
            //
            // ------------------------------------------------

            return Math.random() - 0.5;

        }
    );


    const result =
        sorted.map(
            item =>
                item.task
        );


    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
        "======================================"
    );

    console.log(
        "LESSON TASK PRIORITY ORDER"
    );

    console.log(
        "======================================"
    );


    console.table(
        result.map(
            task => ({

                taskId:
                    task.taskId,

                type:
                    task.taskType,

                duration:
                    task.duration,

                roomRequired:
                    task.requiresRoom,

                roomType:
                    task.roomType,

                maxPerDay:
                    task.maxLessonsPerDay,

                priority:
                    calculateTaskPriorityScore(
                        task,
                        data
                    )

            })
        )
    );


    return result;

}

// ============================================================
// PREPARE SMART TASK ORDER
// ============================================================

function prepareSmartLessonTaskOrder(
    data
) {

    if (
        !data ||
        !Array.isArray(data.lessonTasks)
    ) {

        throw new Error(
            "Cannot prepare task order: lesson tasks are unavailable."
        );

    }


    const orderedTasks =
        sortLessonTasksByPriority(
            data.lessonTasks,
            data
        );


    // ========================================================
    // RESET PLACEMENT STATE
    // ========================================================

    orderedTasks.forEach(
        task => {

            task.placed =
                false;

            task.periodIds =
                [];

            task.roomId =
                null;

        }
    );


    // ========================================================
    // STORE ORDER
    // ========================================================

    data.lessonTasks =
        orderedTasks;


    console.log(
        "Smart lesson task ordering completed.",
        {
            totalTasks:
                orderedTasks.length
        }
    );


    return orderedTasks;

}

// ============================================================
// STAGE 6C — CANDIDATE SLOT SCORING
// ============================================================
//
// Determines how GOOD a valid timetable slot is.
//
// Stage 6B asks:
//
//     "Which lesson should be placed first?"
//
// Stage 6C asks:
//
//     "Of all valid slots, which slot is BEST for this lesson?"
//
// IMPORTANT:
//
// This stage does NOT reserve or place lessons.
//
// It only:
//
//     1. examines candidate slots
//     2. calculates a score
//     3. explains the score
//     4. returns candidates ordered from BEST → WORST
//
// Higher score = better slot.
//
// ============================================================


// ============================================================
// GET TEACHER DAILY LESSON COUNT
// ============================================================

function getTeacherDailyLessonCount(
    indexes,
    teacherId,
    dayNumber
) {

    if (
        !indexes ||
        !teacherId ||
        !Number.isFinite(
            Number(dayNumber)
        )
    ) {

        return 0;

    }


    const normalizedTeacherId =
        normalizeTimetableId(
            teacherId
        );


    let count = 0;


    // ========================================================
    // COUNT OCCUPIED TEACHER PERIODS
    // ========================================================

    const prefix =
        `${normalizedTeacherId}__`;


    indexes.teacherPeriod.forEach(
        key => {

            if (
                !key.startsWith(
                    prefix
                )
            ) {

                return;

            }


            const periodId =
                key.substring(
                    prefix.length
                );


            const period =
                timetableState?.periods?.find(
                    item =>
                        normalizeTimetableId(
                            item.id
                        ) === periodId
                );


            if (
                period &&
                Number(period.dayNumber) ===
                Number(dayNumber)
            ) {

                count++;

            }

        }
    );


    return count;

}


// ============================================================
// GET TEACHER DAILY LESSON COUNT FROM PERIODS
// ============================================================
//
// This version uses the actual normalized periods supplied
// by the generator instead of depending on global state.
//
// ============================================================

function getTeacherDailyLessonCountFromPeriods(
    indexes,
    teacherId,
    dayNumber,
    periods
) {

    if (
        !indexes ||
        !teacherId ||
        !Array.isArray(periods)
    ) {

        return 0;

    }


    const normalizedTeacherId =
        normalizeTimetableId(
            teacherId
        );


    let count = 0;


    const periodMap =
        new Map();


    periods.forEach(
        period => {

            periodMap.set(
                normalizeTimetableId(
                    period.id
                ),
                period
            );

        }
    );


    const prefix =
        `${normalizedTeacherId}__`;


    indexes.teacherPeriod.forEach(
        key => {

            if (
                !key.startsWith(
                    prefix
                )
            ) {

                return;

            }


            const periodId =
                key.substring(
                    prefix.length
                );


            const period =
                periodMap.get(
                    periodId
                );


            if (
                period &&
                Number(period.dayNumber) ===
                Number(dayNumber)
            ) {

                count++;

            }

        }
    );


    return count;

}


// ============================================================
// GET TEACHER WEEKLY LESSON COUNT
// ============================================================

function getTeacherWeeklyLessonCount(
    indexes,
    teacherId
) {

    if (
        !indexes ||
        !teacherId
    ) {

        return 0;

    }


    const normalizedTeacherId =
        normalizeTimetableId(
            teacherId
        );


    const prefix =
        `${normalizedTeacherId}__`;


    let count = 0;


    indexes.teacherPeriod.forEach(
        key => {

            if (
                key.startsWith(
                    prefix
                )
            ) {

                count++;

            }

        }
    );


    return count;

}


// ============================================================
// GET STREAM DAILY LESSON COUNT
// ============================================================
//
// Used for timetable balance.
//
// This is NOT the requirement daily limit.
//
// The requirement limit is handled separately by:
//
//     getDailyRequirementLessonCount()
//
// This function tells us how busy the stream already is
// on a particular day.
//
// ============================================================

function getStreamDailyLessonCount(
    indexes,
    streamId,
    dayNumber,
    periods
) {

    if (
        !indexes ||
        !streamId ||
        !Array.isArray(periods)
    ) {

        return 0;

    }


    const normalizedStreamId =
        normalizeTimetableId(
            streamId
        );


    const periodMap =
        new Map();


    periods.forEach(
        period => {

            periodMap.set(
                normalizeTimetableId(
                    period.id
                ),
                period
            );

        }
    );


    const prefix =
        `${normalizedStreamId}__`;


    let count = 0;


    indexes.streamPeriod.forEach(
        key => {

            if (
                !key.startsWith(
                    prefix
                )
            ) {

                return;

            }


            const periodId =
                key.substring(
                    prefix.length
                );


            const period =
                periodMap.get(
                    periodId
                );


            if (
                period &&
                Number(period.dayNumber) ===
                Number(dayNumber)
            ) {

                count++;

            }

        }
    );


    return count;

}


// ============================================================
// CHECK IF PERIOD IS LATE
// ============================================================
//
// Used to slightly discourage putting difficult lessons
// into the final teaching periods unless necessary.
//
// ============================================================

function getPeriodPositionScore(
    period,
    dayPeriods
) {

    if (
        !period ||
        !Array.isArray(dayPeriods) ||
        dayPeriods.length === 0
    ) {

        return 0;

    }


    const teachingPeriods =
        dayPeriods.filter(
            item =>
                item.isTeachingPeriod !== false &&
                item.periodType !== "break" &&
                item.periodType !== "lunch"
        );


    if (
        teachingPeriods.length === 0
    ) {

        return 0;

    }


    const firstOrder =
        Number(
            teachingPeriods[0].periodOrder
        );


    const lastOrder =
        Number(
            teachingPeriods[
                teachingPeriods.length - 1
            ].periodOrder
        );


    const currentOrder =
        Number(
            period.periodOrder
        );


    if (
        lastOrder ===
        firstOrder
    ) {

        return 0;

    }


    const position =
        (
            currentOrder -
            firstOrder
        ) /
        (
            lastOrder -
            firstOrder
        );


    // Earlier periods receive a small bonus.
    // Later periods receive a small penalty.

    return Math.round(
        10 -
        (
            position * 10
        )
    );

}


// ============================================================
// CALCULATE CANDIDATE SLOT SCORE
// ============================================================
//
// IMPORTANT:
//
// This function assumes the slot has already passed:
//
//     checkSingleSlotConflict()
//
// Therefore this function is about QUALITY,
// not basic validity.
//
// ============================================================

function calculateCandidateSlotScore(
    task,
    period,
    room,
    data,
    indexes
) {

    if (
        !task ||
        !period ||
        !data ||
        !indexes
    ) {

        return {

            score:
                -Infinity,

            reasons:
                [
                    "Invalid candidate data."
                ]

        };

    }


    let score = 0;

    const reasons = [];


    // ========================================================
    // DAY
    // ========================================================

    const dayNumber =
        Number(
            period.dayNumber
        );


    // ========================================================
    // REQUIREMENT DAILY USAGE
    // ========================================================

    const requirementId =
        normalizeTimetableId(
            task.requirementId
        );


    const requirementDailyCount =
        getDailyRequirementLessonCount(
            indexes,
            requirementId,
            dayNumber
        );


    // --------------------------------------------------------
    // Prefer spreading lessons across the week.
    // --------------------------------------------------------

    if (
        requirementDailyCount === 0
    ) {

        score += 35;

        reasons.push(
            "Subject has no lesson on this day."
        );

    }
    else if (
        requirementDailyCount === 1
    ) {

        score += 10;

        reasons.push(
            "Subject already has one lesson on this day."
        );

    }
    else {

        score -=
            requirementDailyCount * 20;

        reasons.push(
            "Subject already has multiple lessons on this day."
        );

    }


    // ========================================================
    // STREAM DAILY BALANCE
    // ========================================================

    const streamDailyCount =
        getStreamDailyLessonCount(
            indexes,
            task.streamId,
            dayNumber,
            data.periods
        );


    if (
        streamDailyCount === 0
    ) {

        score += 25;

        reasons.push(
            "Stream has no lesson on this day."
        );

    }
    else if (
        streamDailyCount <= 2
    ) {

        score += 10;

        reasons.push(
            "Stream has a light timetable on this day."
        );

    }
    else if (
        streamDailyCount >= 5
    ) {

        score -= 25;

        reasons.push(
            "Stream is already heavily loaded on this day."
        );

    }


    // ========================================================
    // TEACHER DAILY BALANCE
    // ========================================================

    if (
        task.teacherId
    ) {

        const teacherDailyCount =
            getTeacherDailyLessonCountFromPeriods(
                indexes,
                task.teacherId,
                dayNumber,
                data.periods
            );


        if (
            teacherDailyCount === 0
        ) {

            score += 20;

            reasons.push(
                "Teacher has no lesson on this day."
            );

        }
        else if (
            teacherDailyCount <= 2
        ) {

            score += 8;

            reasons.push(
                "Teacher has a light workload on this day."
            );

        }
        else if (
            teacherDailyCount >= 5
        ) {

            score -= 20;

            reasons.push(
                "Teacher is heavily loaded on this day."
            );

        }

    }


    // ========================================================
    // TEACHER WEEKLY BALANCE
    // ========================================================

    if (
        task.teacherId
    ) {

        const teacher =
            data.lookup.teachers.get(
                task.teacherId
            );


        const weeklyCount =
            getTeacherWeeklyLessonCount(
                indexes,
                task.teacherId
            );


        const weeklyLimit =
            Number(
                teacher?.maxLessonsPerWeek
            ) || 0;


        if (
            weeklyLimit > 0
        ) {

            const remaining =
                weeklyLimit -
                weeklyCount;


            if (
                remaining <= 2
            ) {

                score -= 20;

                reasons.push(
                    "Teacher is close to the weekly workload limit."
                );

            }
            else if (
                remaining <= 5
            ) {

                score -= 5;

            }

        }

    }


    // ========================================================
    // PERIOD POSITION
    // ========================================================

    const dayPeriods =
        data.periods.filter(
            item =>
                Number(
                    item.dayNumber
                ) ===
                dayNumber
        );


    const positionScore =
        getPeriodPositionScore(
            period,
            dayPeriods
        );


    score +=
        positionScore;


    if (
        positionScore > 0
    ) {

        reasons.push(
            "Earlier teaching period is preferred."
        );

    }


    // ========================================================
    // ROOM USAGE
    // ========================================================

    if (
        room &&
        room.id
    ) {

        // Prefer a room that is not already heavily used.
        //
        // We calculate usage from roomPeriod.

        const roomId =
            normalizeTimetableId(
                room.id
            );


        const roomPrefix =
            `${roomId}__`;


        let roomWeeklyUsage =
            0;


        indexes.roomPeriod.forEach(
            key => {

                if (
                    key.startsWith(
                        roomPrefix
                    )
                ) {

                    roomWeeklyUsage++;

                }

            }
        );


        if (
            roomWeeklyUsage <= 2
        ) {

            score += 10;

            reasons.push(
                "Room has light weekly usage."
            );

        }
        else if (
            roomWeeklyUsage >= 15
        ) {

            score -= 5;

            reasons.push(
                "Room has high weekly usage."
            );

        }

    }


    // ========================================================
    // FINAL
    // ========================================================

    return {

        score,

        reasons

    };

}


// ============================================================
// SCORE SINGLE LESSON CANDIDATES
// ============================================================
//
// Returns all VALID candidate slots for a task.
//
// Nothing is reserved here.
//
// ============================================================

function getScoredSingleLessonCandidates(
    task,
    data,
    indexes
) {

    if (
        !task ||
        !data ||
        !indexes
    ) {

        return [];

    }


    const teachingPeriods =
        getTeachingPeriods(
            data.periods
        );


    const compatibleRooms =
        getCompatibleRooms(
            task,
            data.rooms
        );


    if (
        task.requiresRoom &&
        compatibleRooms.length === 0
    ) {

        return [];

    }


    const candidates = [];


    // ========================================================
    // TEST EVERY PERIOD
    // ========================================================

    teachingPeriods.forEach(
        period => {

            const candidateRooms =
                task.requiresRoom
                    ? compatibleRooms
                    : [null];


            candidateRooms.forEach(
                room => {

                    const conflict =
                        checkSingleSlotConflict(
                            task,
                            period,
                            room,
                            indexes
                        );


                    if (
                        !conflict ||
                        !conflict.valid
                    ) {

                        return;

                    }


                    const scoring =
                        calculateCandidateSlotScore(
                            task,
                            period,
                            room,
                            data,
                            indexes
                        );


                    candidates.push({

                        taskId:
                            task.taskId,

                        period,

                        room,

                        score:
                            scoring.score,

                        reasons:
                            scoring.reasons

                    });

                }
            );

        }
    );


    // ========================================================
    // BEST CANDIDATE FIRST
    // ========================================================

    candidates.sort(
        (
            a,
            b
        ) => {

            if (
                b.score !==
                a.score
            ) {

                return (
                    b.score -
                    a.score
                );

            }


            return (
                Math.random() -
                0.5
            );

        }
    );


    return candidates;

}


// ============================================================
// GET BEST SINGLE LESSON CANDIDATE
// ============================================================

function getBestSingleLessonCandidate(
    task,
    data,
    indexes
) {

    const candidates =
        getScoredSingleLessonCandidates(
            task,
            data,
            indexes
        );


    if (
        candidates.length === 0
    ) {

        return null;

    }


    return candidates[0];

}

// ============================================================
// STAGE 6D — DOUBLE LESSON CANDIDATE SCORING
// ============================================================
//
// Determines which consecutive pair is the BEST location
// for a double lesson.
//
// Example:
//
//     Monday P1 + P2
//     Monday P2 + P3
//     Monday P3 + P4
//     Tuesday P1 + P2
//     ...
//
// Each valid pair receives a score.
//
// Higher score = better placement.
//
// IMPORTANT:
//
// This stage DOES NOT reserve periods.
//
// It only:
//
//     1. finds valid consecutive pairs
//     2. checks both periods
//     3. scores the pair
//     4. returns candidates BEST → WORST
//
// ============================================================


// ============================================================
// CALCULATE DOUBLE LESSON CANDIDATE SCORE
// ============================================================

function calculateDoubleLessonCandidateScore(
    task,
    firstPeriod,
    secondPeriod,
    room,
    data,
    indexes
) {

    if (
        !task ||
        !firstPeriod ||
        !secondPeriod ||
        !data ||
        !indexes
    ) {

        return {

            score:
                -Infinity,

            reasons:
                [
                    "Invalid double lesson candidate data."
                ]

        };

    }


    let score = 0;

    const reasons = [];


    // ========================================================
    // DAY
    // ========================================================

    const dayNumber =
        Number(
            firstPeriod.dayNumber
        );


    // ========================================================
    // REQUIREMENT DAILY COUNT
    // ========================================================
    //
    // A double occupies TWO periods.
    //
    // Therefore the current daily count is evaluated before
    // adding both periods.
    //
    // ========================================================

    const requirementId =
        normalizeTimetableId(
            task.requirementId
        );


    const currentRequirementDailyCount =
        getDailyRequirementLessonCount(
            indexes,
            requirementId,
            dayNumber
        );


    // ========================================================
    // PREFER DAYS WITH NO LESSON FOR THIS SUBJECT
    // ========================================================

    if (
        currentRequirementDailyCount === 0
    ) {

        score += 45;

        reasons.push(
            "Subject has no lesson on this day."
        );

    }
    else if (
        currentRequirementDailyCount === 1
    ) {

        score += 15;

        reasons.push(
            "Subject has only one lesson on this day."
        );

    }
    else {

        score -=
            currentRequirementDailyCount * 25;

        reasons.push(
            "Subject already has multiple lessons on this day."
        );

    }


    // ========================================================
    // STREAM DAILY LOAD
    // ========================================================

    const streamDailyCount =
        getStreamDailyLessonCount(
            indexes,
            task.streamId,
            dayNumber,
            data.periods
        );


    // IMPORTANT:
    //
    // A double lesson adds TWO lessons to the stream's
    // daily timetable.

    const projectedStreamDailyCount =
        streamDailyCount + 2;


    if (
        streamDailyCount === 0
    ) {

        score += 30;

        reasons.push(
            "Stream has no lesson on this day."
        );

    }
    else if (
        streamDailyCount <= 2
    ) {

        score += 12;

        reasons.push(
            "Stream has a light daily workload."
        );

    }
    else if (
        projectedStreamDailyCount <= 5
    ) {

        score -= 5;

        reasons.push(
            "Stream will have a moderate daily workload."
        );

    }
    else {

        score -= 30;

        reasons.push(
            "Double lesson would heavily load the stream on this day."
        );

    }


    // ========================================================
    // TEACHER DAILY LOAD
    // ========================================================

    if (
        task.teacherId
    ) {

        const teacherDailyCount =
            getTeacherDailyLessonCountFromPeriods(
                indexes,
                task.teacherId,
                dayNumber,
                data.periods
            );


        const projectedTeacherDailyCount =
            teacherDailyCount + 2;


        const teacher =
            data.lookup.teachers.get(
                task.teacherId
            );


        const maxTeacherDaily =
            Number(
                teacher?.maxLessonsPerDay
            ) || 0;


        if (
            teacherDailyCount === 0
        ) {

            score += 25;

            reasons.push(
                "Teacher has no lesson on this day."
            );

        }
        else if (
            teacherDailyCount <= 2
        ) {

            score += 10;

            reasons.push(
                "Teacher has a light daily workload."
            );

        }
        else if (
            maxTeacherDaily > 0 &&
            projectedTeacherDailyCount >
            maxTeacherDaily
        ) {

            // This should normally already have been rejected
            // by a stronger conflict check later.

            score -= 100;

            reasons.push(
                "Double lesson would exceed teacher daily workload."
            );

        }
        else if (
            projectedTeacherDailyCount >= 5
        ) {

            score -= 20;

            reasons.push(
                "Teacher would have a heavy daily workload."
            );

        }

    }


    // ========================================================
    // TEACHER WEEKLY LOAD
    // ========================================================

    if (
        task.teacherId
    ) {

        const teacher =
            data.lookup.teachers.get(
                task.teacherId
            );


        const weeklyCount =
            getTeacherWeeklyLessonCount(
                indexes,
                task.teacherId
            );


        const weeklyLimit =
            Number(
                teacher?.maxLessonsPerWeek
            ) || 0;


        if (
            weeklyLimit > 0
        ) {

            const projectedWeeklyCount =
                weeklyCount + 2;


            const remainingAfterPlacement =
                weeklyLimit -
                projectedWeeklyCount;


            if (
                remainingAfterPlacement < 0
            ) {

                score -= 100;

                reasons.push(
                    "Double lesson would exceed teacher weekly workload."
                );

            }
            else if (
                remainingAfterPlacement <= 2
            ) {

                score -= 15;

                reasons.push(
                    "Teacher would be close to weekly workload limit."
                );

            }

        }

    }


    // ========================================================
    // PERIOD POSITION
    // ========================================================
    //
    // Evaluate BOTH periods.
    //
    // A double lesson should preferably not consume the
    // final two teaching periods unless necessary.
    //
    // ========================================================

    const dayPeriods =
        data.periods.filter(
            period =>
                Number(
                    period.dayNumber
                ) ===
                dayNumber
        );


    const firstPositionScore =
        getPeriodPositionScore(
            firstPeriod,
            dayPeriods
        );


    const secondPositionScore =
        getPeriodPositionScore(
            secondPeriod,
            dayPeriods
        );


    const averagePositionScore =
        (
            firstPositionScore +
            secondPositionScore
        ) / 2;


    score +=
        Math.round(
            averagePositionScore
        );


    if (
        averagePositionScore > 0
    ) {

        reasons.push(
            "Double lesson is positioned relatively early in the day."
        );

    }


    // ========================================================
    // ROOM USAGE
    // ========================================================

    if (
        room &&
        room.id
    ) {

        const roomId =
            normalizeTimetableId(
                room.id
            );


        const roomPrefix =
            `${roomId}__`;


        let roomWeeklyUsage =
            0;


        indexes.roomPeriod.forEach(
            key => {

                if (
                    key.startsWith(
                        roomPrefix
                    )
                ) {

                    roomWeeklyUsage++;

                }

            }
        );


        if (
            roomWeeklyUsage <= 2
        ) {

            score += 10;

            reasons.push(
                "Room has light weekly usage."
            );

        }
        else if (
            roomWeeklyUsage >= 15
        ) {

            score -= 5;

            reasons.push(
                "Room has high weekly usage."
            );

        }

    }


    // ========================================================
    // KEEP SAME DAY AS A TRUE DOUBLE
    // ========================================================
    //
    // This is normally guaranteed by
    // arePeriodsConsecutive().
    //
    // We still score it defensively.
    //
    // ========================================================

    if (
        Number(firstPeriod.dayNumber) ===
        Number(secondPeriod.dayNumber)
    ) {

        score += 10;

    }


    // ========================================================
    // FINAL RESULT
    // ========================================================

    return {

        score,

        reasons

    };

}


// ============================================================
// GET SCORED DOUBLE LESSON CANDIDATES
// ============================================================
//
// Returns every VALID consecutive pair.
//
// Nothing is reserved here.
//
// ============================================================

function getScoredDoubleLessonCandidates(
    task,
    data,
    indexes
) {

    if (
        !task ||
        !data ||
        !indexes
    ) {

        return [];

    }


    // ========================================================
    // GET CONSECUTIVE PERIOD PAIRS
    // ========================================================

    const pairs =
        getConsecutiveTeachingPeriodPairs(
            data.periods
        );


    if (
        pairs.length === 0
    ) {

        return [];

    }


    // ========================================================
    // GET COMPATIBLE ROOMS
    // ========================================================

    const compatibleRooms =
        getCompatibleRooms(
            task,
            data.rooms
        );


    if (
        task.requiresRoom &&
        compatibleRooms.length === 0
    ) {

        return [];

    }


    const candidates = [];


    // ========================================================
    // TEST EVERY PERIOD PAIR
    // ========================================================

    pairs.forEach(
        pair => {

            const candidateRooms =
                task.requiresRoom
                    ? compatibleRooms
                    : [null];


            candidateRooms.forEach(
                room => {

                    // ========================================
                    // VALIDATE THE DOUBLE
                    // ========================================

                    const conflict =
                        checkDoubleLessonConflict(
                            task,
                            pair.first,
                            pair.second,
                            room,
                            indexes
                        );


                    if (
                        !conflict ||
                        !conflict.valid
                    ) {

                        return;

                    }


                    // ========================================
                    // SCORE THE DOUBLE
                    // ========================================

                    const scoring =
                        calculateDoubleLessonCandidateScore(
                            task,
                            pair.first,
                            pair.second,
                            room,
                            data,
                            indexes
                        );


                    candidates.push({

                        taskId:
                            task.taskId,

                        firstPeriod:
                            pair.first,

                        secondPeriod:
                            pair.second,

                        room,

                        score:
                            scoring.score,

                        reasons:
                            scoring.reasons

                    });

                }
            );

        }
    );


    // ========================================================
    // BEST PAIR FIRST
    // ========================================================

    candidates.sort(
        (
            a,
            b
        ) => {

            if (
                b.score !==
                a.score
            ) {

                return (
                    b.score -
                    a.score
                );

            }


            return (
                Math.random() -
                0.5
            );

        }
    );


    return candidates;

}


// ============================================================
// GET BEST DOUBLE LESSON CANDIDATE
// ============================================================

function getBestDoubleLessonCandidate(
    task,
    data,
    indexes
) {

    const candidates =
        getScoredDoubleLessonCandidates(
            task,
            data,
            indexes
        );


    if (
        candidates.length === 0
    ) {

        return null;

    }


    return candidates[0];

}


// ============================================================
// DEBUG DOUBLE LESSON CANDIDATES
// ============================================================

function logDoubleLessonCandidates(
    task,
    data,
    indexes
) {

    const candidates =
        getScoredDoubleLessonCandidates(
            task,
            data,
            indexes
        );


    console.log(
        "======================================"
    );

    console.log(
        "DOUBLE LESSON CANDIDATES"
    );

    console.log(
        "Task:",
        task?.taskId
    );

    console.log(
        "======================================"
    );


    console.table(
        candidates.map(
            candidate => ({

                taskId:
                    candidate.taskId,

                firstPeriod:
                    candidate.firstPeriod?.id,

                secondPeriod:
                    candidate.secondPeriod?.id,

                firstOrder:
                    candidate.firstPeriod?.periodOrder,

                secondOrder:
                    candidate.secondPeriod?.periodOrder,

                day:
                    candidate.firstPeriod?.dayName ||
                    candidate.firstPeriod?.dayNumber,

                room:
                    candidate.room?.id ||
                    "None",

                score:
                    candidate.score

            })
        )
    );


    return candidates;

}

// ============================================================
// STAGE 6E — UNIFIED SMART CANDIDATE SELECTION
// ============================================================
//
// Purpose:
//
// Creates ONE common candidate-selection interface for:
//
//     SINGLE lessons
//     DOUBLE lessons
//
// Stage 6B:
//     Determines which TASK should be scheduled first.
//
// Stage 6C:
//     Scores SINGLE lesson candidates.
//
// Stage 6D:
//     Scores DOUBLE lesson candidates.
//
// Stage 6E:
//     Combines both into one scheduling decision.
//
// IMPORTANT:
//
// This stage DOES NOT reserve slots.
//
// It only answers:
//
//     "What is currently the best valid placement
//      for this task?"
//
// Reservation is handled later by the placement stage.
//
// ============================================================


// ============================================================
// GET SMART CANDIDATES FOR TASK
// ============================================================

function getSmartCandidatesForTask(
    task,
    data,
    indexes
) {

    if (
        !task ||
        !data ||
        !indexes
    ) {

        return [];

    }


    // ========================================================
    // DOUBLE LESSON
    // ========================================================

    if (
        task.taskType === "double"
    ) {

        return getScoredDoubleLessonCandidates(
            task,
            data,
            indexes
        );

    }


    // ========================================================
    // SINGLE LESSON
    // ========================================================

    return getScoredSingleLessonCandidates(
        task,
        data,
        indexes
    );

}


// ============================================================
// GET BEST SMART CANDIDATE
// ============================================================
//
// Returns the highest-scoring valid candidate.
//
// IMPORTANT:
//
// This function DOES NOT reserve the slot.
//
// ============================================================

function getBestSmartCandidate(
    task,
    data,
    indexes
) {

    const candidates =
        getSmartCandidatesForTask(
            task,
            data,
            indexes
        );


    if (
        !Array.isArray(candidates) ||
        candidates.length === 0
    ) {

        return null;

    }


    return candidates[0];

}


// ============================================================
// DESCRIBE SMART CANDIDATE
// ============================================================
//
// Used for debugging and diagnostics.
//
// ============================================================

function describeSmartCandidate(
    candidate
) {

    if (
        !candidate
    ) {

        return {

            available:
                false

        };

    }


    // ========================================================
    // SINGLE
    // ========================================================

    if (
        candidate.period
    ) {

        return {

            available:
                true,

            type:
                "single",

            periodId:
                candidate.period?.id ||
                null,

            roomId:
                candidate.room?.id ||
                null,

            score:
                candidate.score ??
                0,

            reasons:
                candidate.reasons ||
                []

        };

    }


    // ========================================================
    // DOUBLE
    // ========================================================

    if (
        candidate.firstPeriod ||
        candidate.secondPeriod
    ) {

        return {

            available:
                true,

            type:
                "double",

            firstPeriodId:
                candidate.firstPeriod?.id ||
                null,

            secondPeriodId:
                candidate.secondPeriod?.id ||
                null,

            roomId:
                candidate.room?.id ||
                null,

            score:
                candidate.score ??
                0,

            reasons:
                candidate.reasons ||
                []

        };

    }


    return {

        available:
            false

    };

}


// ============================================================
// GET BEST CANDIDATE FOR EACH TASK
// ============================================================
//
// This gives the generator a complete picture:
//
// TASK A → best candidate
// TASK B → best candidate
// TASK C → best candidate
//
// This is NOT placement yet.
//
// ============================================================

function getBestCandidatesForTasks(
    tasks,
    data,
    indexes
) {

    if (
        !Array.isArray(tasks)
    ) {

        return [];

    }


    const results = [];


    tasks.forEach(
        task => {

            if (
                !task ||
                task.placed
            ) {

                return;

            }


            const candidate =
                getBestSmartCandidate(
                    task,
                    data,
                    indexes
                );


            results.push({

                task,

                candidate,

                available:
                    Boolean(
                        candidate
                    ),

                score:
                    candidate?.score ??
                    -Infinity

            });

        }
    );


    return results;

}


// ============================================================
// SORT TASKS BY BEST AVAILABLE CANDIDATE
// ============================================================
//
// This is the important Stage 6E decision.
//
// We already have task priority from Stage 6B.
//
// Now we additionally consider:
//
//     "How difficult is this task to place RIGHT NOW?"
//
// A task with fewer valid candidates is more constrained.
//
// Therefore:
//
//     fewer candidates = higher priority
//
// If candidate availability is equal,
// use the Stage 6B task ordering.
//
// ============================================================

function sortTasksBySmartPlacementDifficulty(
    tasks,
    data,
    indexes
) {

    if (
        !Array.isArray(tasks)
    ) {

        return [];

    }


    const analysis =
        tasks
            .filter(
                task =>
                    task &&
                    !task.placed
            )
            .map(
                task => {

                    const candidates =
                        getSmartCandidatesForTask(
                            task,
                            data,
                            indexes
                        );


                    return {

                        task,

                        candidateCount:
                            candidates.length,

                        bestScore:
                            candidates.length > 0
                                ? candidates[0].score
                                : -Infinity

                    };

                }
            );


    analysis.sort(
        (
            a,
            b
        ) => {

            // =================================================
            // NO CANDIDATES FIRST
            // =================================================
            //
            // We want impossible tasks identified early.
            //
            // =================================================

            const aImpossible =
                a.candidateCount === 0;


            const bImpossible =
                b.candidateCount === 0;


            if (
                aImpossible !==
                bImpossible
            ) {

                return aImpossible
                    ? -1
                    : 1;

            }


            // =================================================
            // FEWER CANDIDATES = MORE CONSTRAINED
            // =================================================

            if (
                a.candidateCount !==
                b.candidateCount
            ) {

                return (
                    a.candidateCount -
                    b.candidateCount
                );

            }


            // =================================================
            // BEST CANDIDATE SCORE
            // =================================================

            if (
                a.bestScore !==
                b.bestScore
            ) {

                return (
                    b.bestScore -
                    a.bestScore
                );

            }


            return 0;

        }
    );


    return analysis.map(
        item =>
            item.task
    );

}


// ============================================================
// ANALYZE TASK PLACEMENT DIFFICULTY
// ============================================================
//
// Useful before the actual placement loop.
//
// ============================================================

function analyzeTaskPlacementDifficulty(
    tasks,
    data,
    indexes
) {

    if (
        !Array.isArray(tasks)
    ) {

        return [];

    }


    const analysis = [];


    tasks.forEach(
        task => {

            if (
                !task ||
                task.placed
            ) {

                return;

            }


            const candidates =
                getSmartCandidatesForTask(
                    task,
                    data,
                    indexes
                );


            const bestCandidate =
                candidates.length > 0
                    ? candidates[0]
                    : null;


            analysis.push({

                taskId:
                    task.taskId,

                taskType:
                    task.taskType,

                streamId:
                    task.streamId,

                subjectId:
                    task.subjectId,

                teacherId:
                    task.teacherId,

                candidateCount:
                    candidates.length,

                bestScore:
                    bestCandidate?.score ??
                    null,

                bestCandidate:
                    describeSmartCandidate(
                        bestCandidate
                    )

            });

        }
    );


    return analysis;

}


// ============================================================
// LOG SMART PLACEMENT ANALYSIS
// ============================================================

function logSmartPlacementAnalysis(
    tasks,
    data,
    indexes
) {

    const analysis =
        analyzeTaskPlacementDifficulty(
            tasks,
            data,
            indexes
        );


    console.log(
        "======================================"
    );

    console.log(
        "STAGE 6E — SMART PLACEMENT ANALYSIS"
    );

    console.log(
        "======================================"
    );


    console.table(
        analysis.map(
            item => ({

                taskId:
                    item.taskId,

                type:
                    item.taskType,

                candidateCount:
                    item.candidateCount,

                bestScore:
                    item.bestScore,

                firstPeriod:
                    item.bestCandidate
                        ?.firstPeriodId ||
                    item.bestCandidate
                        ?.periodId ||
                    null,

                secondPeriod:
                    item.bestCandidate
                        ?.secondPeriodId ||
                    null,

                room:
                    item.bestCandidate
                        ?.roomId ||
                    null

            })
        )
    );


    console.log(
        "======================================"
    );


    return analysis;

}


// ============================================================
// SELECT NEXT TASK TO PLACE
// ============================================================
//
// This is the main Stage 6E selector.
//
// It combines:
//
//     1. Task priority
//     2. Candidate availability
//     3. Candidate difficulty
//     4. Candidate score
//
// It does NOT reserve anything.
//
// ============================================================

function selectNextSmartTask(
    tasks,
    data,
    indexes
) {

    if (
        !Array.isArray(tasks) ||
        !data ||
        !indexes
    ) {

        return null;

    }


    const unplacedTasks =
        tasks.filter(
            task =>
                task &&
                !task.placed
        );


    if (
        unplacedTasks.length === 0
    ) {

        return null;

    }


    const analyzed =
        unplacedTasks.map(
            task => {

                const candidates =
                    getSmartCandidatesForTask(
                        task,
                        data,
                        indexes
                    );


                return {

                    task,

                    candidates,

                    candidateCount:
                        candidates.length,

                    bestCandidate:
                        candidates[0] ||
                        null

                };

            }
        );


    // ========================================================
    // SORT NEXT TASK
    // ========================================================

    analyzed.sort(
        (
            a,
            b
        ) => {

            // ------------------------------------------------
            // MOST CONSTRAINED FIRST
            // ------------------------------------------------

            if (
                a.candidateCount !==
                b.candidateCount
            ) {

                return (
                    a.candidateCount -
                    b.candidateCount
                );

            }


            // ------------------------------------------------
            // BEST CANDIDATE SCORE
            // ------------------------------------------------

            const scoreA =
                a.bestCandidate?.score ??
                -Infinity;


            const scoreB =
                b.bestCandidate?.score ??
                -Infinity;


            if (
                scoreA !==
                scoreB
            ) {

                return (
                    scoreB -
                    scoreA
                );

            }


            // ------------------------------------------------
            // DOUBLE LESSON FIRST
            // ------------------------------------------------

            if (
                a.task.duration !==
                b.task.duration
            ) {

                return (
                    b.task.duration -
                    a.task.duration
                );

            }


            // ------------------------------------------------
            // ROOM REQUIRED FIRST
            // ------------------------------------------------

            if (
                a.task.requiresRoom !==
                b.task.requiresRoom
            ) {

                return a.task.requiresRoom
                    ? -1
                    : 1;

            }


            return 0;

        }
    );


    const selected =
        analyzed[0];


    if (
        !selected
    ) {

        return null;

    }


    console.log(
        "STAGE 6E — NEXT SMART TASK:",
        {

            taskId:
                selected.task.taskId,

            taskType:
                selected.task.taskType,

            candidateCount:
                selected.candidateCount,

            bestScore:
                selected.bestCandidate?.score ??
                null

        }
    );


    return {

        task:
            selected.task,

        candidate:
            selected.bestCandidate,

        candidates:
            selected.candidates,

        candidateCount:
            selected.candidateCount

    };

}

// ============================================================
// STAGE 6F — SMART TIMETABLE PLACEMENT ENGINE
// ============================================================
//
// This is the first real scheduling engine.
//
// Responsibilities:
//
// 1. Receive validated lesson tasks.
// 2. Create fresh occupancy indexes.
// 3. Select the next most constrained task.
// 4. Select its best available candidate.
// 5. Reserve the required period(s).
// 6. Create timetable entries.
// 7. Continue until all tasks are processed.
// 8. Record tasks that could not be placed.
//
// IMPORTANT:
//
// This stage does NOT save anything to Supabase.
//
// It only generates the timetable in memory.
//
// ============================================================


// ============================================================
// CREATE EMPTY PLACEMENT RESULT
// ============================================================

function createTimetablePlacementResult() {

    return {

        entries:
            [],

        placedTasks:
            [],

        failedTasks:
            [],

        statistics: {

            totalTasks:
                0,

            placedTasks:
                0,

            failedTasks:
                0,

            totalPeriodsPlaced:
                0

        }

    };

}


// ============================================================
// PLACE SINGLE TASK USING SMART CANDIDATE
// ============================================================
//
// The candidate has already been validated and scored.
//
// IMPORTANT:
//
// We still perform a final conflict check immediately
// before reservation.
//
// If reservation succeeds but entry creation fails,
// the reservation is rolled back.
//
// ============================================================

function placeSelectedSingleTask(
    task,
    candidate,
    indexes
) {

    if (
        !task ||
        !candidate ||
        !candidate.period ||
        !indexes
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Invalid single lesson candidate."

        };

    }


    const period =
        candidate.period;


    const room =
        candidate.room ||
        null;


    // ========================================================
    // FINAL SAFETY CHECK
    // ========================================================

    const conflict =
        checkSingleSlotConflict(
            task,
            period,
            room,
            indexes
        );


    if (
        !conflict ||
        !conflict.valid
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                conflict?.reason ||
                "Candidate became unavailable."

        };

    }


    // ========================================================
    // RESERVE
    // ========================================================

    const reserved =
        reserveSlot(
            task,
            period,
            room,
            indexes
        );


    if (
        !reserved
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Failed to reserve single lesson slot."

        };

    }


    // ========================================================
    // CREATE ENTRY
    // ========================================================

    const entry =
        createGeneratedEntry(
            task,
            period,
            room
        );


    // ========================================================
    // ENTRY CREATION FAILED
    // ========================================================
    //
    // Reservation already happened.
    //
    // Therefore rollback immediately.
    //
    // ========================================================

    if (
        !entry
    ) {

        releaseReservedSlot(
            task,
            period,
            room,
            indexes
        );


        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Failed to create timetable entry; reservation was rolled back."

        };

    }


    // ========================================================
    // UPDATE TASK
    // ========================================================

    task.placed =
        true;


    task.periodIds =
        [
            period.id
        ];


    task.roomId =
        room?.id ||
        null;


    // ========================================================
    // RESULT
    // ========================================================

    return {

        placed:
            true,

        entries:
            [
                entry
            ],

        reason:
            ""

    };

}


// ============================================================
// PLACE DOUBLE TASK USING SMART CANDIDATE
// ============================================================
//
// A double candidate contains:
//
//     firstPeriod
//     secondPeriod
//     room
//
// Both periods must be reserved.
//
// ============================================================

function placeSelectedDoubleTask(
    task,
    candidate,
    indexes
) {

    if (
        !task ||
        !candidate ||
        !candidate.firstPeriod ||
        !candidate.secondPeriod ||
        !indexes
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Invalid double lesson candidate."

        };

    }


    const firstPeriod =
        candidate.firstPeriod;


    const secondPeriod =
        candidate.secondPeriod;


    const room =
        candidate.room ||
        null;


    // ========================================================
    // FINAL CONSECUTIVE CHECK
    // ========================================================

    if (
        !arePeriodsConsecutive(
            firstPeriod,
            secondPeriod
        )
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Double lesson periods are not consecutive."

        };

    }


    // ========================================================
    // FINAL CONFLICT CHECK
    // ========================================================

    const conflict =
        checkDoubleLessonConflict(
            task,
            firstPeriod,
            secondPeriod,
            room,
            indexes
        );


    if (
        !conflict ||
        !conflict.valid
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                conflict?.reason ||
                "Double lesson candidate became unavailable."

        };

    }


    // ========================================================
    // RESERVE FIRST PERIOD
    // ========================================================

    const firstReserved =
        reserveSlot(
            task,
            firstPeriod,
            room,
            indexes
        );


    if (
        !firstReserved
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Failed to reserve first double-lesson period."

        };

    }


    // ========================================================
    // RESERVE SECOND PERIOD
    // ========================================================

    const secondReserved =
        reserveSlot(
            task,
            secondPeriod,
            room,
            indexes
        );


    if (
        !secondReserved
    ) {

        // ----------------------------------------------------
        // ROLLBACK FIRST PERIOD
        // ----------------------------------------------------

        releaseReservedSlot(
            task,
            firstPeriod,
            room,
            indexes
        );


        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Failed to reserve second double-lesson period."

        };

    }


    // ========================================================
    // CREATE ENTRIES
    // ========================================================

    const firstEntry =
        createGeneratedEntry(
            task,
            firstPeriod,
            room
        );


    const secondEntry =
        createGeneratedEntry(
            task,
            secondPeriod,
            room
        );


    // ========================================================
    // ENTRY CREATION FAILURE
    // ========================================================

    if (
        !firstEntry ||
        !secondEntry
    ) {

        // ----------------------------------------------------
        // ROLLBACK BOTH
        // ----------------------------------------------------

        releaseReservedSlot(
            task,
            firstPeriod,
            room,
            indexes
        );


        releaseReservedSlot(
            task,
            secondPeriod,
            room,
            indexes
        );


        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Failed to create double lesson timetable entries; reservations were rolled back."

        };

    }


    // ========================================================
    // UPDATE TASK
    // ========================================================

    task.placed =
        true;


    task.periodIds =
        [
            firstPeriod.id,
            secondPeriod.id
        ];


    task.roomId =
        room?.id ||
        null;


    // ========================================================
    // SUCCESS
    // ========================================================

    return {

        placed:
            true,

        entries:
            [
                firstEntry,
                secondEntry
            ],

        reason:
            ""

    };

}


// ============================================================
// RELEASE RESERVED SLOT
// ============================================================
//
// Used only for rollback.
//
// This reverses reserveSlot() for ONE period.
//
// ============================================================

function releaseReservedSlot(
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

        return false;

    }


    const streamId =
        normalizeTimetableId(
            task.streamId
        );


    const periodId =
        normalizeTimetableId(
            period.id
        );


    // ========================================================
    // STREAM
    // ========================================================

    indexes.streamPeriod.delete(
        `${streamId}__${periodId}`
    );


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

        indexes.teacherPeriod.delete(
            `${teacherId}__${periodId}`
        );

    }


    // ========================================================
    // ROOM
    // ========================================================

    if (
        room &&
        room.id
    ) {

        const roomId =
            normalizeTimetableId(
                room.id
            );


        indexes.roomPeriod.delete(
            `${roomId}__${periodId}`
        );

    }


    // ========================================================
    // REQUIREMENT / DAY
    // ========================================================

    const requirementId =
        normalizeTimetableId(
            task.requirementId
        );


    const dayNumber =
        Number(
            period.dayNumber
        );


    if (
        requirementId &&
        Number.isFinite(dayNumber)
    ) {

        const key =
            getDailyRequirementKey(
                requirementId,
                dayNumber
            );


        const currentCount =
            getDailyRequirementLessonCount(
                indexes,
                requirementId,
                dayNumber
            );


        if (
            currentCount <= 1
        ) {

            indexes.dailyRequirementLessons.delete(
                key
            );

        }
        else {

            indexes.dailyRequirementLessons.set(
                key,
                currentCount - 1
            );

        }

    }


    return true;

}


// ============================================================
// PLACE SELECTED TASK
// ============================================================
//
// Routes the task to the correct placement function.
//
// ============================================================

function placeSelectedSmartTask(
    selection,
    indexes
) {

    if (
        !selection ||
        !selection.task ||
        !selection.candidate
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "No valid task selection was supplied."

        };

    }


    const task =
        selection.task;


    const candidate =
        selection.candidate;


    // ========================================================
    // DOUBLE
    // ========================================================

    if (
        task.taskType === "double"
    ) {

        return placeSelectedDoubleTask(
            task,
            candidate,
            indexes
        );

    }


    // ========================================================
    // SINGLE
    // ========================================================

    return placeSelectedSingleTask(
        task,
        candidate,
        indexes
    );

}


// ============================================================
// SELECT NEXT SMART TASK
// ============================================================
//
// Connects:
//
//     6B — Task Priority
//     6C — Single Candidate Scoring
//     6D — Double Candidate Scoring
//
// Determines:
//
//     1. Which task is most restricted
//     2. Its current valid candidates
//     3. Its best candidate
//
// IMPORTANT:
//
// Returns ALL ranked candidates.
//
// That allows Stage 6F to try:
//
//     BEST → SECOND BEST → THIRD BEST → ...
//
// ============================================================

function selectNextSmartTask(
    remainingTasks,
    data,
    indexes
) {

    if (
        !Array.isArray(remainingTasks) ||
        remainingTasks.length === 0 ||
        !data ||
        !indexes
    ) {

        return null;

    }


    const taskCandidates = [];


    // ========================================================
    // ANALYSE EVERY REMAINING TASK
    // ========================================================

    remainingTasks.forEach(
        task => {

            if (
                !task ||
                task.placed
            ) {

                return;

            }


            // ==================================================
            // TASK PRIORITY FROM 6B
            // ==================================================

            const priority =
                calculateTaskPriorityScore(
                    task,
                    data
                );


            // ==================================================
            // GET CURRENT VALID CANDIDATES
            // ==================================================

            let candidates = [];


            if (
                task.taskType === "double"
            ) {

                candidates =
                    getScoredDoubleLessonCandidates(
                        task,
                        data,
                        indexes
                    );

            }
            else {

                candidates =
                    getScoredSingleLessonCandidates(
                        task,
                        data,
                        indexes
                    );

            }


            // ==================================================
            // NUMBER OF AVAILABLE CANDIDATES
            // ==================================================

            const candidateCount =
                candidates.length;


            // ==================================================
            // BEST CANDIDATE
            // ==================================================

            const bestCandidate =
                candidateCount > 0
                    ? candidates[0]
                    : null;


            // ==================================================
            // STORE COMPLETE ANALYSIS
            // ==================================================

            taskCandidates.push({

                task,

                priority,

                candidates,

                candidateCount,

                candidate:
                    bestCandidate

            });

        }
    );


    // ========================================================
    // NO TASKS AVAILABLE
    // ========================================================

    if (
        taskCandidates.length === 0
    ) {

        return null;

    }


    // ========================================================
    // SORT TASKS
    // ========================================================
    //
    // Priority:
    //
    // 1. Fewest candidates
    // 2. Higher 6B priority
    // 3. Better candidate score
    // 4. Longer task
    // 5. Room-required
    //
    // ========================================================

    taskCandidates.sort(
        (
            a,
            b
        ) => {

            // ------------------------------------------------
            // FEWEST CANDIDATES FIRST
            // ------------------------------------------------

            if (
                a.candidateCount !==
                b.candidateCount
            ) {

                return (
                    a.candidateCount -
                    b.candidateCount
                );

            }


            // ------------------------------------------------
            // HIGHER TASK PRIORITY
            // ------------------------------------------------

            if (
                b.priority !==
                a.priority
            ) {

                return (
                    b.priority -
                    a.priority
                );

            }


            // ------------------------------------------------
            // BETTER CANDIDATE SCORE
            // ------------------------------------------------

            const scoreA =
                a.candidate?.score ??
                -Infinity;


            const scoreB =
                b.candidate?.score ??
                -Infinity;


            if (
                scoreB !==
                scoreA
            ) {

                return (
                    scoreB -
                    scoreA
                );

            }


            // ------------------------------------------------
            // DOUBLE FIRST
            // ------------------------------------------------

            if (
                a.task.duration !==
                b.task.duration
            ) {

                return (
                    b.task.duration -
                    a.task.duration
                );

            }


            // ------------------------------------------------
            // ROOM REQUIRED FIRST
            // ------------------------------------------------

            if (
                a.task.requiresRoom !==
                b.task.requiresRoom
            ) {

                return a.task.requiresRoom
                    ? -1
                    : 1;

            }


            // ------------------------------------------------
            // RANDOM TIE BREAK
            // ------------------------------------------------

            return (
                Math.random() -
                0.5
            );

        }
    );


    // ========================================================
    // SELECT FIRST TASK
    // ========================================================

    const selected =
        taskCandidates[0];


    if (
        !selected
    ) {

        return null;

    }


    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
        "SMART TASK SELECTION:",
        {

            taskId:
                selected.task?.taskId,

            taskType:
                selected.task?.taskType,

            priority:
                selected.priority,

            availableCandidates:
                selected.candidateCount,

            bestCandidateScore:
                selected.candidate?.score ??
                null

        }
    );


    // ========================================================
    // RETURN SELECTION
    // ========================================================

    return {

        task:
            selected.task,

        candidate:
            selected.candidate,

        candidates:
            selected.candidates,

        priority:
            selected.priority,

        candidateCount:
            selected.candidateCount

    };

}


// ============================================================
// SMART TIMETABLE GENERATION
// ============================================================
//
// Main Stage 6F engine.
//
// ============================================================

function generateSmartTimetable(
    data
) {

    console.log(
        "======================================"
    );

    console.log(
        "STAGE 6F — SMART TIMETABLE GENERATION"
    );

    console.log(
        "======================================"
    );


    // ========================================================
    // VALIDATE DATA
    // ========================================================

    if (
        !data ||
        !Array.isArray(data.lessonTasks) ||
        !Array.isArray(data.periods)
    ) {

        throw new Error(
            "Cannot generate timetable: generator data is incomplete."
        );

    }


    // ========================================================
    // CREATE FRESH OCCUPANCY INDEXES
    // ========================================================

   const indexes =
    createOccupancyIndexes(
        data
    );

    // ========================================================
    // CREATE RESULT
    // ========================================================

    const result =
        createTimetablePlacementResult();


    result.statistics.totalTasks =
        data.lessonTasks.length;


    // ========================================================
    // COPY ACTIVE TASKS
    // ========================================================
    //
    // Do NOT modify the original task ordering here.
    //
    // ========================================================

    const remainingTasks =
        data.lessonTasks.filter(
            task =>
                task &&
                !task.placed
        );


    // ========================================================
    // SAFETY LIMIT
    // ========================================================

    const maximumIterations =
        Math.max(
            remainingTasks.length * 3,
            100
        );


    let iteration =
        0;


    // ========================================================
    // MAIN PLACEMENT LOOP
    // ========================================================

    while (
        remainingTasks.length > 0 &&
        iteration < maximumIterations
    ) {

        iteration++;


        // ====================================================
        // SELECT NEXT TASK
        // ====================================================

        const selection =
            selectNextSmartTask(
                remainingTasks,
                data,
                indexes
            );


        // ====================================================
        // NO TASK
        // ====================================================

        if (
            !selection
        ) {

            break;

        }


        const task =
            selection.task;


        // ====================================================
        // NO CANDIDATES
        // ====================================================

        if (
            selection.candidateCount === 0
        ) {

            console.warn(
                "SMART PLACEMENT — NO CANDIDATE:",
                {

                    taskId:
                        task.taskId,

                    taskType:
                        task.taskType,

                    streamId:
                        task.streamId,

                    subjectId:
                        task.subjectId

                }
            );


            result.failedTasks.push({

                task,

                reason:
                    "No valid placement candidate exists."

            });


            task.placed =
                false;


            task.periodIds =
                [];


            task.roomId =
                null;


            // ------------------------------------------------
            // REMOVE FROM ACTIVE TASKS
            // ------------------------------------------------

            const failedIndex =
                remainingTasks.indexOf(
                    task
                );


            if (
                failedIndex >= 0
            ) {

                remainingTasks.splice(
                    failedIndex,
                    1
                );

            }


            continue;

        }


        // ====================================================
        // TRY ALL RANKED CANDIDATES
        // ====================================================
        //
        // IMPORTANT:
        //
        // We DO NOT fail the task after candidate #1 fails.
        //
        // We try every candidate returned by 6C / 6D.
        //
        // ====================================================

        let successfulPlacement =
            null;


        let successfulCandidate =
            null;


        let lastFailureReason =
            "All candidates failed.";


        for (
            const candidate of selection.candidates
        ) {

            const candidateSelection = {

                task,

                candidate

            };


            const attempt =
                placeSelectedSmartTask(
                    candidateSelection,
                    indexes
                );


            // =================================================
            // SUCCESS
            // =================================================

            if (
                attempt.placed
            ) {

                successfulPlacement =
                    attempt;


                successfulCandidate =
                    candidate;


                break;

            }


            // =================================================
            // FAILED CANDIDATE
            // =================================================

            lastFailureReason =
                attempt.reason ||
                lastFailureReason;


            console.warn(
                "SMART CANDIDATE REJECTED:",
                {

                    taskId:
                        task.taskId,

                    taskType:
                        task.taskType,

                    candidateScore:
                        candidate.score,

                    reason:
                        attempt.reason

                }
            );

        }


        // ====================================================
        // SUCCESSFUL TASK
        // ====================================================

        if (
            successfulPlacement &&
            successfulPlacement.placed
        ) {

            result.entries.push(
                ...successfulPlacement.entries
            );


            result.placedTasks.push({

                task,

                entries:
                    successfulPlacement.entries,

                candidate:
                    successfulCandidate

            });


            result.statistics.placedTasks++;


            // =================================================
            // TASK DURATION IS AUTHORITATIVE
            // =================================================
            //
            // Single:
            //     duration = 1
            //
            // Double:
            //     duration = 2
            //
            // =================================================

            result.statistics.totalPeriodsPlaced +=
                Number(
                    task.duration
                ) || 0;


            // -------------------------------------------------
            // REMOVE PLACED TASK
            // -------------------------------------------------

            const placedIndex =
                remainingTasks.indexOf(
                    task
                );


            if (
                placedIndex >= 0
            ) {

                remainingTasks.splice(
                    placedIndex,
                    1
                );

            }


            console.log(
                "SMART PLACEMENT SUCCESS:",
                {

                    taskId:
                        task.taskId,

                    type:
                        task.taskType,

                    periods:
                        task.periodIds,

                    room:
                        task.roomId,

                    score:
                        successfulCandidate?.score ??
                        null

                }
            );


            continue;

        }


        // ====================================================
        // ALL CANDIDATES FAILED
        // ====================================================

        console.warn(
            "SMART PLACEMENT — ALL CANDIDATES FAILED:",
            {

                taskId:
                    task.taskId,

                taskType:
                    task.taskType,

                reason:
                    lastFailureReason

            }
        );


        result.failedTasks.push({

            task,

            reason:
                lastFailureReason

        });


        task.placed =
            false;


        task.periodIds =
            [];


        task.roomId =
            null;


        // ----------------------------------------------------
        // REMOVE FAILED TASK
        // ----------------------------------------------------

        const failedIndex =
            remainingTasks.indexOf(
                task
            );


        if (
            failedIndex >= 0
        ) {

            remainingTasks.splice(
                failedIndex,
                1
            );

        }

    }


    // ========================================================
    // HANDLE SAFETY LIMIT
    // ========================================================

    if (
        iteration >=
        maximumIterations &&
        remainingTasks.length > 0
    ) {

        remainingTasks.forEach(
            task => {

                result.failedTasks.push({

                    task,

                    reason:
                        "Generator safety iteration limit reached."

                });

            }
        );

    }


    // ========================================================
    // FINAL STATISTICS
    // ========================================================

    result.statistics.failedTasks =
        result.failedTasks.length;


    // ========================================================
    // LOG RESULT
    // ========================================================

    console.log(
        "======================================"
    );

    console.log(
        "STAGE 6F — GENERATION COMPLETE"
    );

    console.log(
        "======================================"
    );

    console.log(
        "Total tasks:",
        result.statistics.totalTasks
    );

    console.log(
        "Placed tasks:",
        result.statistics.placedTasks
    );

    console.log(
        "Failed tasks:",
        result.statistics.failedTasks
    );

    console.log(
        "Teaching periods placed:",
        result.statistics.totalPeriodsPlaced
    );

    console.log(
        "Iterations:",
        iteration
    );

    console.log(
        "======================================"
    );


    // ========================================================
    // FAILED TASK TABLE
    // ========================================================

    if (
        result.failedTasks.length > 0
    ) {

        console.table(
            result.failedTasks.map(
                item => ({

                    taskId:
                        item.task?.taskId ||
                        null,

                    type:
                        item.task?.taskType ||
                        null,

                    streamId:
                        item.task?.streamId ||
                        null,

                    subjectId:
                        item.task?.subjectId ||
                        null,

                    teacherId:
                        item.task?.teacherId ||
                        null,

                    reason:
                        item.reason

                })
            )
        );

    }


    // ========================================================
    // SUCCESS TABLE
    // ========================================================

    if (
        result.placedTasks.length > 0
    ) {

        console.table(
            result.placedTasks.map(
                item => ({

                    taskId:
                        item.task?.taskId ||
                        null,

                    type:
                        item.task?.taskType ||
                        null,

                    periods:
                        item.task?.periodIds?.join(
                            ", "
                        ) ||
                        "",

                    room:
                        item.task?.roomId ||
                        null,

                    score:
                        item.candidate?.score ??
                        null

                })
            )
        );

    }


    // ========================================================
    // RETURN COMPLETE RESULT
    // ========================================================

    return {

        ...result,

        indexes

    };

}




// ============================================================
// GENERATE TIMETABLE — APPLICATION ENTRY POINT
// ============================================================
//
// STAGE FLOW:
//
// 1. Prepare generator data
// 2. Prepare task order
// 3. Stage 6F — Smart generation
// 4. Stage 6G — Final audit
// 5. Stage 7 — SAVE + DISPLAY + APPLICATION STATE
//
// ============================================================

async function generateTimetable() {

    console.log(
        "======================================"
    );

    console.log(
        "GENERATE TIMETABLE ENTRY POINT"
    );

    console.log(
        "======================================"
    );


    // ========================================================
    // PREVENT DUPLICATE GENERATION
    // ========================================================

    if (
        timetableGenerationRunning
    ) {

        console.warn(
            "Timetable generation is already running."
        );

        return null;

    }


    if (
        !timetableState ||
        !timetableState.schoolId
    ) {

        throw new Error(
            "Please select a school first."
        );

    }


    timetableGenerationRunning =
        true;


    try {

        setTimetableGenerationStatus(
            "Preparing timetable generation...",
            "info"
        );


        // ====================================================
        // STAGE 1 — PREPARE GENERATOR DATA
        // ====================================================

        const generatorData =
            await prepareTimetableGeneratorData();


        if (!generatorData) {

            throw new Error(
                "Timetable generator data could not be prepared."
            );

        }


        // ====================================================
        // STAGE 2 — PREPARE TASK ORDER
        // ====================================================

        prepareSmartLessonTaskOrder(
            generatorData
        );


        // ====================================================
        // STAGE 6F — SMART GENERATOR
        // ====================================================

        setTimetableGenerationStatus(
            "Generating timetable...",
            "info"
        );


        const result =
            generateSmartTimetable(
                generatorData
            );


        if (
            !result
        ) {

            throw new Error(
                "Smart timetable generator returned no result."
            );

        }


        if (
            !Array.isArray(
                result.entries
            )
        ) {

            throw new Error(
                "Generator returned an invalid entries array."
            );

        }


        // ====================================================
        // STAGE 6G — FINAL AUDIT
        // ====================================================

        const audit =
            auditGeneratedTimetable(
                generatorData,
                result
            );


        generatorData.generationAudit =
            audit;

        result.audit =
            audit;


        // ====================================================
        // BLOCK INVALID TIMETABLE
        // ====================================================

        if (
            !audit.valid
        ) {

            console.error(
                "TIMETABLE GENERATION BLOCKED."
            );

            console.error(
                "Stage 6G audit failed."
            );

            console.error(
                "Audit errors:",
                audit.errors
            );


            showTimetableConflicts(
                audit.errors || [],
                generatorData.lookup ||
                generatorData
            );


            setTimetableGenerationStatus(
                "Timetable failed final audit. Nothing was saved.",
                "error"
            );


            return {

                ...result,

                audit,

                saved:
                    false

            };

        }


        console.log(
            "======================================"
        );

        console.log(
            "✅ 6G AUDIT PASSED"
        );

        console.log(
            "======================================"
        );


        // ====================================================
        // STORE GENERATION RESULT
        // ====================================================

        generatorData.generationResult =
            result;


        // ====================================================
        // GENERATION DEBUG
        // ====================================================

        console.log(
            "======================================"
        );

        console.log(
            "TIMETABLE GENERATION RESULT"
        );

        console.log(
            "======================================"
        );

        console.log(
            "Total tasks:",
            result.statistics?.totalTasks || 0
        );

        console.log(
            "Placed tasks:",
            result.statistics?.placedTasks || 0
        );

        console.log(
            "Failed tasks:",
            result.statistics?.failedTasks || 0
        );

        console.log(
            "Periods placed:",
            result.statistics?.totalPeriodsPlaced || 0
        );

        console.log(
            "Generated entries:",
            result.entries.length
        );

        console.log(
            "======================================"
        );


        // ====================================================
        // STAGE 7 — SAVE GENERATED TIMETABLE
        // ====================================================
        //
        // IMPORTANT:
        // Do not duplicate the scheduling logic here.
        //
        // Stage 6 has already produced:
        //
        //     result.entries
        //
        // Stage 7 only persists those entries.
        //
        // ====================================================

        setTimetableGenerationStatus(
            "Saving generated timetable...",
            "info"
        );


        const schoolId =
            timetableState.schoolId;


        // ----------------------------------------------------
        // REMOVE PREVIOUS GENERATED ENTRIES
        // ----------------------------------------------------

        const deleteResult =
            await supabaseClient
                .from(
                    "timetable_entries"
                )
                .delete()
                .eq(
                    "school_id",
                    schoolId
                );


        if (
            deleteResult.error
        ) {

            throw new Error(
                "Failed to clear previous timetable: " +
                deleteResult.error.message
            );

        }


        // ----------------------------------------------------
        // PREPARE DATABASE ENTRIES
        // ----------------------------------------------------

        const entriesToSave =
            result.entries.map(
                entry => {

                    return {

                        school_id:
                            schoolId,

                        generation_id:
                            entry.generation_id ||
                            entry.generationId ||
                            null,

                        period_id:
                            entry.period_id ||
                            entry.periodId,

                        stream_id:
                            entry.stream_id ||
                            entry.streamId,

                        subject_id:
                            entry.subject_id ||
                            entry.subjectId,

                        teacher_id:
                            entry.teacher_id ||
                            entry.teacherId,

                        room_id:
                            entry.room_id ||
                            entry.roomId ||
                            null

                    };

                }
            );


        // ----------------------------------------------------
        // VALIDATE BEFORE INSERT
        // ----------------------------------------------------

        const invalidEntries =
            entriesToSave.filter(
                entry =>
                    !entry.school_id ||
                    !entry.period_id ||
                    !entry.stream_id ||
                    !entry.subject_id ||
                    !entry.teacher_id
            );


        if (
            invalidEntries.length > 0
        ) {

            console.error(
                "Invalid entries before database insert:",
                invalidEntries
            );


            throw new Error(
                `${invalidEntries.length} generated timetable entries are missing required IDs.`
            );

        }


        // ----------------------------------------------------
        // INSERT GENERATED ENTRIES
        // ----------------------------------------------------

        if (
            entriesToSave.length > 0
        ) {

            const insertResult =
                await supabaseClient
                    .from(
                        "timetable_entries"
                    )
                    .insert(
                        entriesToSave
                    );


            if (
                insertResult.error
            ) {

                throw new Error(
                    "Failed to save generated timetable: " +
                    insertResult.error.message
                );

            }

        }


        // ====================================================
        // STAGE 7 — UPDATE LOCAL STATE
        // ====================================================

        generatedTimetableEntries =
            entriesToSave;


        // ====================================================
        // STAGE 7 — LOAD DISPLAY DATA
        // ====================================================

        await loadTimetableFilters();


        await loadGeneratedTimetable();


        // ====================================================
        // STAGE 7 — SUMMARY
        // ====================================================

        const totalTasks =
            result.statistics?.totalTasks || 0;


        const generatedEntries =
            result.entries?.length || 0;


        const failedTasks =
            result.statistics?.failedTasks || 0;


        showTimetableSummary(
            totalTasks,
            generatedEntries,
            failedTasks
        );


        // ====================================================
        // STAGE 7 — CONFLICT DISPLAY
        // ====================================================

        if (
            Array.isArray(
                result.failedTasks
            ) &&
            result.failedTasks.length > 0
        ) {

            console.warn(
                "Some timetable tasks were not placed:",
                result.failedTasks
            );

        }


        // ====================================================
        // FINAL STATUS
        // ====================================================

        setTimetableGenerationStatus(
            `Timetable generated successfully. ${generatedEntries} lesson periods saved.`,
            "success"
        );


        // ====================================================
        // FINAL DEBUG
        // ====================================================

        console.log(
            "======================================"
        );

        console.log(
            "✅ STAGE 7 COMPLETE"
        );

        console.log(
            "======================================"
        );

        console.log(
            "Saved entries:",
            entriesToSave.length
        );

        console.log(
            "School:",
            schoolId
        );

        console.log(
            "======================================"
        );


        // ====================================================
        // RETURN FINAL RESULT
        // ====================================================

        return {

            ...result,

            audit,

            saved:
                true,

            savedEntries:
                entriesToSave.length

        };

    }

    catch (
        error
    ) {

        console.error(
            "======================================"
        );

        console.error(
            "❌ TIMETABLE GENERATION FAILED"
        );

        console.error(
            error
        );

        console.error(
            "======================================"
        );


        setTimetableGenerationStatus(
            "Timetable generation failed: " +
            (
                error.message ||
                "Unknown error"
            ),
            "error"
        );


        throw error;

    }

    finally {

        timetableGenerationRunning =
            false;

    }

}




// ============================================================
// STAGE 6G — FINAL TIMETABLE CONSTRAINT AUDIT
// ============================================================
//
// Independently verifies the timetable produced by Stage 6F.
//
// IMPORTANT:
//
// This stage does NOT trust the placement indexes created
// during generation.
//
// It rebuilds its own audit structures from:
//
//     result.entries
//     data.lessonTasks
//     data.requirements
//     data.lookup
//     data.periods
//
// Therefore Stage 6G can detect problems even if Stage 6F
// accidentally maintained an index incorrectly.
//
// Stage 6G DOES NOT:
//
//     - modify timetable entries
//     - reserve slots
//     - save to Supabase
//
// It only validates the generated timetable.
//
// ============================================================


// ============================================================
// CREATE EMPTY AUDIT RESULT
// ============================================================

function createTimetableAuditResult() {

    return {

        valid:
            true,

        errors:
            [],

        warnings:
            [],

        checks: {

            requirementTotals:
                true,

            doubleLessons:
                true,

            streamConflicts:
                true,

            teacherConflicts:
                true,

            roomConflicts:
                true,

            dailyRequirementLimits:
                true,

            teacherDailyLimits:
                true,

            teacherWeeklyLimits:
                true,

            teacherConsecutiveLimits:
                true,

            roomTypes:
                true,

            duplicateEntries:
                true,

            periodReferences:
                true

        },

        statistics: {

            totalEntries:
                0,

            totalTasks:
                0,

            placedTasks:
                0,

            failedTasks:
                0,

            auditedPeriods:
                0,

            auditedRequirements:
                0,

            auditedTeachers:
                0,

            auditedRooms:
                0

        }

    };

}


// ============================================================
// ADD AUDIT ERROR
// ============================================================

function addTimetableAuditError(
    audit,
    checkName,
    message,
    details = {}
) {

    audit.valid =
        false;


    if (
        audit.checks.hasOwnProperty(
            checkName
        )
    ) {

        audit.checks[checkName] =
            false;

    }


    audit.errors.push({

        check:
            checkName,

        message,

        ...details

    });

}


// ============================================================
// ADD AUDIT WARNING
// ============================================================

function addTimetableAuditWarning(
    audit,
    checkName,
    message,
    details = {}
) {

    audit.warnings.push({

        check:
            checkName,

        message,

        ...details

    });

}


// ============================================================
// NORMALIZE GENERATED ENTRY
// ============================================================

function normalizeGeneratedTimetableEntry(
    entry
) {

    if (
        !entry ||
        typeof entry !== "object"
    ) {

        return null;

    }


    return {

        schoolId:
            normalizeTimetableId(
                entry.school_id
            ),

        periodId:
            normalizeTimetableId(
                entry.period_id
            ),

        streamId:
            normalizeTimetableId(
                entry.stream_id
            ),

        subjectId:
            normalizeTimetableId(
                entry.subject_id
            ),

        teacherId:
            normalizeTimetableId(
                entry.teacher_id
            ),

        roomId:
            normalizeTimetableId(
                entry.room_id
            )

    };

}


// ============================================================
// BUILD AUDIT LOOKUPS
// ============================================================

function buildTimetableAuditLookups(
    data
) {

    const periods =
        new Map();


    const streams =
        new Map();


    const subjects =
        new Map();


    const teachers =
        new Map();


    const rooms =
        new Map();


    const requirements =
        new Map();


    // ========================================================
    // PERIODS
    // ========================================================

    (data.periods || [])
        .forEach(
            period => {

                const id =
                    normalizeTimetableId(
                        period?.id
                    );


                if (
                    id
                ) {

                    periods.set(
                        id,
                        period
                    );

                }

            }
        );


    // ========================================================
    // STREAMS
    // ========================================================

    (data.streams || [])
        .forEach(
            stream => {

                const id =
                    normalizeTimetableId(
                        stream?.id
                    );


                if (
                    id
                ) {

                    streams.set(
                        id,
                        stream
                    );

                }

            }
        );


    // ========================================================
    // SUBJECTS
    // ========================================================

    (data.subjects || [])
        .forEach(
            subject => {

                const id =
                    normalizeTimetableId(
                        subject?.id
                    );


                if (
                    id
                ) {

                    subjects.set(
                        id,
                        subject
                    );

                }

            }
        );


    // ========================================================
    // TEACHERS
    // ========================================================

    (data.teachers || [])
        .forEach(
            teacher => {

                const id =
                    normalizeTimetableId(
                        teacher?.id
                    );


                if (
                    id
                ) {

                    teachers.set(
                        id,
                        teacher
                    );

                }

            }
        );


    // ========================================================
    // ROOMS
    // ========================================================

    (data.rooms || [])
        .forEach(
            room => {

                const id =
                    normalizeTimetableId(
                        room?.id
                    );


                if (
                    id
                ) {

                    rooms.set(
                        id,
                        room
                    );

                }

            }
        );


    // ========================================================
    // REQUIREMENTS
    // ========================================================

    (data.requirements || [])
        .forEach(
            requirement => {

                const id =
                    normalizeTimetableId(
                        requirement?.requirementId
                    );


                if (
                    id
                ) {

                    requirements.set(
                        id,
                        requirement
                    );

                }

            }
        );


    return {

        periods,

        streams,

        subjects,

        teachers,

        rooms,

        requirements

    };

}


// ============================================================
// VALIDATE PERIOD REFERENCES
// ============================================================

function auditGeneratedPeriodReferences(
    entries,
    lookups,
    audit
) {

    const seenPeriodIds =
        new Set();


    entries.forEach(
        (
            entry,
            index
        ) => {

            const normalized =
                normalizeGeneratedTimetableEntry(
                    entry
                );


            if (
                !normalized
            ) {

                addTimetableAuditError(
                    audit,
                    "periodReferences",
                    "Generated entry is invalid.",
                    {
                        entryIndex:
                            index
                    }
                );


                return;

            }


            if (
                !normalized.periodId
            ) {

                addTimetableAuditError(
                    audit,
                    "periodReferences",
                    "Generated entry has no period ID.",
                    {
                        entryIndex:
                            index
                    }
                );


                return;

            }


            if (
                !lookups.periods.has(
                    normalized.periodId
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "periodReferences",
                    "Generated entry references a period that does not exist.",
                    {
                        entryIndex:
                            index,

                        periodId:
                            normalized.periodId

                    }
                );

            }


            seenPeriodIds.add(
                normalized.periodId
            );

        }
    );


    return seenPeriodIds;

}


// ============================================================
// AUDIT DUPLICATE GENERATED ENTRIES
// ============================================================
//
// A duplicate is considered the same:
//
//     stream + period + subject + teacher + room
//
// ============================================================

function auditDuplicateGeneratedEntries(
    entries,
    audit
) {

    const seen =
        new Set();


    entries.forEach(
        (
            entry,
            index
        ) => {

            const normalized =
                normalizeGeneratedTimetableEntry(
                    entry
                );


            if (
                !normalized
            ) {

                return;

            }


            const key =
                [
                    normalized.streamId,
                    normalized.periodId,
                    normalized.subjectId,
                    normalized.teacherId,
                    normalized.roomId
                ]
                .join(
                    "__"
                );


            if (
                seen.has(
                    key
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "duplicateEntries",
                    "Duplicate generated timetable entry detected.",
                    {
                        entryIndex:
                            index,

                        key

                    }
                );

            }


            seen.add(
                key
            );

        }
    );

}


// ============================================================
// AUDIT STREAM / PERIOD CONFLICTS
// ============================================================

function auditStreamPeriodConflicts(
    entries,
    audit
) {

    const occupied =
        new Map();


    entries.forEach(
        (
            entry,
            index
        ) => {

            const normalized =
                normalizeGeneratedTimetableEntry(
                    entry
                );


            if (
                !normalized ||
                !normalized.streamId ||
                !normalized.periodId
            ) {

                return;

            }


            const key =
                `${normalized.streamId}__${normalized.periodId}`;


            if (
                occupied.has(
                    key
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "streamConflicts",
                    "Stream has more than one lesson in the same period.",
                    {
                        streamId:
                            normalized.streamId,

                        periodId:
                            normalized.periodId,

                        firstEntryIndex:
                            occupied.get(
                                key
                            ),

                        secondEntryIndex:
                            index

                    }
                );

            }
            else {

                occupied.set(
                    key,
                    index
                );

            }

        }
    );

}


// ============================================================
// AUDIT TEACHER / PERIOD CONFLICTS
// ============================================================

function auditTeacherPeriodConflicts(
    entries,
    audit
) {

    const occupied =
        new Map();


    entries.forEach(
        (
            entry,
            index
        ) => {

            const normalized =
                normalizeGeneratedTimetableEntry(
                    entry
                );


            if (
                !normalized ||
                !normalized.teacherId ||
                !normalized.periodId
            ) {

                return;

            }


            const key =
                `${normalized.teacherId}__${normalized.periodId}`;


            if (
                occupied.has(
                    key
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "teacherConflicts",
                    "Teacher has more than one lesson in the same period.",
                    {
                        teacherId:
                            normalized.teacherId,

                        periodId:
                            normalized.periodId,

                        firstEntryIndex:
                            occupied.get(
                                key
                            ),

                        secondEntryIndex:
                            index

                    }
                );

            }
            else {

                occupied.set(
                    key,
                    index
                );

            }

        }
    );

}


// ============================================================
// AUDIT ROOM / PERIOD CONFLICTS
// ============================================================

function auditRoomPeriodConflicts(
    entries,
    audit
) {

    const occupied =
        new Map();


    entries.forEach(
        (
            entry,
            index
        ) => {

            const normalized =
                normalizeGeneratedTimetableEntry(
                    entry
                );


            if (
                !normalized ||
                !normalized.roomId ||
                !normalized.periodId
            ) {

                return;

            }


            const key =
                `${normalized.roomId}__${normalized.periodId}`;


            if (
                occupied.has(
                    key
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "roomConflicts",
                    "Room is assigned to more than one lesson in the same period.",
                    {
                        roomId:
                            normalized.roomId,

                        periodId:
                            normalized.periodId,

                        firstEntryIndex:
                            occupied.get(
                                key
                            ),

                        secondEntryIndex:
                            index

                    }
                );

            }
            else {

                occupied.set(
                    key,
                    index
                );

            }

        }
    );

}


// ============================================================
// AUDIT REQUIREMENT WEEKLY TOTALS
// ============================================================
//
// Each requirement contains a required number of teaching
// periods per week.
//
// Double task = 2 entries.
// Single task = 1 entry.
//
// Therefore the generated entries must equal:
//
//     requirements.lessonsPerWeek
//
// ============================================================

function auditRequirementWeeklyTotals(
    data,
    entries,
    audit
) {

    const counts =
        new Map();


    // ========================================================
    // BUILD REQUIREMENT → TASK MAPPING
    // ========================================================

    const taskMap =
        new Map();


    (data.lessonTasks || [])
        .forEach(
            task => {

                const requirementId =
                    normalizeTimetableId(
                        task?.requirementId
                    );


                if (
                    !requirementId
                ) {

                    return;

                }


                if (
                    !taskMap.has(
                        requirementId
                    )
                ) {

                    taskMap.set(
                        requirementId,
                        []
                    );

                }


                taskMap.get(
                    requirementId
                ).push(
                    task
                );

            }
        );


    // ========================================================
    // COUNT GENERATED ENTRIES
    // ========================================================

    entries.forEach(
        entry => {

            const normalized =
                normalizeGeneratedTimetableEntry(
                    entry
                );


            if (
                !normalized
            ) {

                return;

            }


            const matchingTasks = [];


            const subjectId =
                normalized.subjectId;


            const streamId =
                normalized.streamId;


            const teacherId =
                normalized.teacherId;


            // ------------------------------------------------
            // FIND REQUIREMENT
            // ------------------------------------------------
            //
            // Generated entries do not contain requirementId.
            // We therefore identify the requirement through
            // stream + subject + teacher.
            //
            // ------------------------------------------------

            (data.requirements || [])
                .forEach(
                    requirement => {

                        if (
                            normalizeTimetableId(
                                requirement.streamId
                            ) !==
                            streamId
                        ) {

                            return;

                        }


                        if (
                            normalizeTimetableId(
                                requirement.subjectId
                            ) !==
                            subjectId
                        ) {

                            return;

                        }


                        const requirementTeacherId =
                            normalizeTimetableId(
                                requirement.teacherId
                            );


                        if (
                            requirementTeacherId &&
                            requirementTeacherId !==
                            teacherId
                        ) {

                            return;

                        }


                        matchingTasks.push(
                            requirement
                        );

                    }
                );


            if (
                matchingTasks.length === 1
            ) {

                const requirementId =
                    normalizeTimetableId(
                        matchingTasks[0].requirementId
                    );


                counts.set(
                    requirementId,
                    (
                        counts.get(
                            requirementId
                        ) || 0
                    ) + 1
                );

            }
            else if (
                matchingTasks.length === 0
            ) {

                addTimetableAuditError(
                    audit,
                    "requirementTotals",
                    "Generated entry could not be matched to a timetable requirement.",
                    {
                        periodId:
                            normalized.periodId,

                        streamId,

                        subjectId,

                        teacherId

                    }
                );

            }
            else {

                addTimetableAuditError(
                    audit,
                    "requirementTotals",
                    "Generated entry matches multiple timetable requirements.",
                    {
                        periodId:
                            normalized.periodId,

                        streamId,

                        subjectId,

                        teacherId,

                        matchingRequirements:
                            matchingTasks.map(
                                requirement =>
                                    requirement.requirementId
                            )

                    }
                );

            }

        }
    );


    // ========================================================
    // COMPARE EXPECTED VS ACTUAL
    // ========================================================

    (data.requirements || [])
        .forEach(
            requirement => {

                const requirementId =
                    normalizeTimetableId(
                        requirement.requirementId
                    );


                const expected =
                    Number(
                        requirement.lessonsPerWeek
                    ) || 0;


                const actual =
                    counts.get(
                        requirementId
                    ) || 0;


                if (
                    expected !==
                    actual
                ) {

                    addTimetableAuditError(
                        audit,
                        "requirementTotals",
                        "Weekly lesson total does not match the requirement.",
                        {
                            requirementId,

                            expected,

                            actual

                        }
                    );

                }

            }
        );

}


// ============================================================
// AUDIT DAILY REQUIREMENT LIMITS
// ============================================================

function auditDailyRequirementLimits(
    data,
    entries,
    audit,
    lookups
) {

    const counts =
        new Map();


    entries.forEach(
        entry => {

            const normalized =
                normalizeGeneratedTimetableEntry(
                    entry
                );


            if (
                !normalized
            ) {

                return;

            }


            const period =
                lookups.periods.get(
                    normalized.periodId
                );


            if (
                !period
            ) {

                return;

            }


            const matchingRequirements =

                (data.requirements || [])
                    .filter(
                        requirement => {

                            if (
                                normalizeTimetableId(
                                    requirement.streamId
                                ) !==
                                normalized.streamId
                            ) {

                                return false;

                            }


                            if (
                                normalizeTimetableId(
                                    requirement.subjectId
                                ) !==
                                normalized.subjectId
                            ) {

                                return false;

                            }


                            const requirementTeacherId =
                                normalizeTimetableId(
                                    requirement.teacherId
                                );


                            return (
                                !requirementTeacherId ||
                                requirementTeacherId ===
                                normalized.teacherId
                            );

                        }
                    );


            if (
                matchingRequirements.length !== 1
            ) {

                return;

            }


            const requirementId =
                normalizeTimetableId(
                    matchingRequirements[0].requirementId
                );


            const key =
                `${requirementId}__${Number(period.dayNumber)}`;


            counts.set(
                key,
                (
                    counts.get(
                        key
                    ) || 0
                ) + 1
            );

        }
    );


    counts.forEach(
        (
            count,
            key
        ) => {

            const separatorIndex =
                key.lastIndexOf(
                    "__"
                );


            const requirementId =
                key.substring(
                    0,
                    separatorIndex
                );


            const dayNumber =
                Number(
                    key.substring(
                        separatorIndex + 2
                    )
                );


            const requirement =
                lookups.requirements.get(
                    requirementId
                );


            if (
                !requirement
            ) {

                return;

            }


            const maxPerDay =
                Number(
                    requirement.maxLessonsPerDay
                ) || 0;


            if (
                maxPerDay > 0 &&
                count >
                maxPerDay
            ) {

                addTimetableAuditError(
                    audit,
                    "dailyRequirementLimits",
                    "Requirement exceeds its maximum daily lesson count.",
                    {
                        requirementId,

                        dayNumber,

                        actual:
                            count,

                        maximum:
                            maxPerDay

                    }
                );

            }

        }
    );

}


// ============================================================
// AUDIT TEACHER DAILY LIMITS
// ============================================================

function auditTeacherDailyLimits(
    data,
    entries,
    audit,
    lookups
) {

    const counts =
        new Map();


    entries.forEach(
        entry => {

            const normalized =
                normalizeGeneratedTimetableEntry(
                    entry
                );


            if (
                !normalized ||
                !normalized.teacherId
            ) {

                return;

            }


            const period =
                lookups.periods.get(
                    normalized.periodId
                );


            if (
                !period
            ) {

                return;

            }


            const key =
                `${normalized.teacherId}__${Number(period.dayNumber)}`;


            counts.set(
                key,
                (
                    counts.get(
                        key
                    ) || 0
                ) + 1
            );

        }
    );


    counts.forEach(
        (
            count,
            key
        ) => {

            const parts =
                key.split(
                    "__"
                );


            const teacherId =
                parts[0];


            const dayNumber =
                Number(
                    parts[1]
                );


            const teacher =
                lookups.teachers.get(
                    teacherId
                );


            if (
                !teacher
            ) {

                return;

            }


            const maximum =
                Number(
                    teacher.maxLessonsPerDay
                ) || 0;


            if (
                maximum > 0 &&
                count >
                maximum
            ) {

                addTimetableAuditError(
                    audit,
                    "teacherDailyLimits",
                    "Teacher exceeds maximum lessons per day.",
                    {
                        teacherId,

                        dayNumber,

                        actual:
                            count,

                        maximum

                    }
                );

            }

        }
    );

}


// ============================================================
// AUDIT TEACHER WEEKLY LIMITS
// ============================================================

function auditTeacherWeeklyLimits(
    entries,
    audit,
    lookups
) {

    const counts =
        new Map();


    entries.forEach(
        entry => {

            const normalized =
                normalizeGeneratedTimetableEntry(
                    entry
                );


            if (
                !normalized ||
                !normalized.teacherId
            ) {

                return;

            }


            counts.set(
                normalized.teacherId,
                (
                    counts.get(
                        normalized.teacherId
                    ) || 0
                ) + 1
            );

        }
    );


    counts.forEach(
        (
            count,
            teacherId
        ) => {

            const teacher =
                lookups.teachers.get(
                    teacherId
                );


            if (
                !teacher
            ) {

                return;

            }


            const maximum =
                Number(
                    teacher.maxLessonsPerWeek
                ) || 0;


            if (
                maximum > 0 &&
                count >
                maximum
            ) {

                addTimetableAuditError(
                    audit,
                    "teacherWeeklyLimits",
                    "Teacher exceeds maximum lessons per week.",
                    {
                        teacherId,

                        actual:
                            count,

                        maximum

                    }
                );

            }

        }
    );

}


// ============================================================
// AUDIT TEACHER CONSECUTIVE LIMITS
// ============================================================
//
// Groups each teacher's lessons by day and checks the longest
// consecutive run using periodOrder.
//
// ============================================================

function auditTeacherConsecutiveLimits(
    entries,
    audit,
    lookups
) {

    const teacherDays =
        new Map();


    // ========================================================
    // BUILD TEACHER/DAY PERIOD GROUPS
    // ========================================================

    entries.forEach(
        entry => {

            const normalized =
                normalizeGeneratedTimetableEntry(
                    entry
                );


            if (
                !normalized ||
                !normalized.teacherId
            ) {

                return;

            }


            const period =
                lookups.periods.get(
                    normalized.periodId
                );


            if (
                !period
            ) {

                return;

            }


            const dayNumber =
                Number(
                    period.dayNumber
                );


            const key =
                `${normalized.teacherId}__${dayNumber}`;


            if (
                !teacherDays.has(
                    key
                )
            ) {

                teacherDays.set(
                    key,
                    []
                );

            }


            teacherDays.get(
                key
            ).push(
                period
            );

        }
    );


    // ========================================================
    // ANALYSE EACH TEACHER / DAY
    // ========================================================

    teacherDays.forEach(
        (
            periods,
            key
        ) => {

            const separatorIndex =
                key.lastIndexOf(
                    "__"
                );


            const teacherId =
                key.substring(
                    0,
                    separatorIndex
                );


            const dayNumber =
                Number(
                    key.substring(
                        separatorIndex + 2
                    )
                );


            const teacher =
                lookups.teachers.get(
                    teacherId
                );


            if (
                !teacher
            ) {

                return;

            }


            const maximum =
                Number(
                    teacher.maxConsecutiveLessons
                ) || 0;


            if (
                maximum <= 0
            ) {

                return;

            }


            // ------------------------------------------------
            // UNIQUE PERIOD ORDERS
            // ------------------------------------------------

            const orders =
                [
                    ...new Set(
                        periods.map(
                            period =>
                                Number(
                                    period.periodOrder
                                )
                        )
                    )
                ]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        a - b
                );


            let currentRun =
                0;


            let longestRun =
                0;


            let previousOrder =
                null;


            orders.forEach(
                order => {

                    if (
                        previousOrder !== null &&
                        order ===
                        previousOrder + 1
                    ) {

                        currentRun++;

                    }
                    else {

                        currentRun = 1;

                    }


                    longestRun =
                        Math.max(
                            longestRun,
                            currentRun
                        );


                    previousOrder =
                        order;

                }
            );


            if (
                longestRun >
                maximum
            ) {

                addTimetableAuditError(
                    audit,
                    "teacherConsecutiveLimits",
                    "Teacher exceeds maximum consecutive lessons.",
                    {
                        teacherId,

                        dayNumber,

                        longestRun,

                        maximum

                    }
                );

            }

        }
    );

}


// ============================================================
// AUDIT DOUBLE LESSON STRUCTURE
// ============================================================
//
// Uses the original lessonTasks and the generated entries.
//
// Each double task must have exactly TWO entries belonging
// to the same requirement, same teacher/stream/subject and
// consecutive teaching periods.
//
// ============================================================

function auditDoubleLessonStructure(
    data,
    result,
    audit,
    lookups
) {

    const entries =
        Array.isArray(
            result?.entries
        )
            ? result.entries
            : [];


    const placedTasks =
        Array.isArray(
            result?.placedTasks
        )
            ? result.placedTasks
            : [];


    // ========================================================
    // TASK → GENERATED ENTRIES
    // ========================================================
    //
    // Stage 6F stores the entries on placedTasks, so use that
    // authoritative relationship rather than trying to
    // reconstruct it from UUID combinations.
    //
    // ========================================================

    placedTasks.forEach(
        placement => {

            const task =
                placement?.task;


            if (
                !task ||
                task.taskType !== "double"
            ) {

                return;

            }


            const taskEntries =
                Array.isArray(
                    placement.entries
                )
                    ? placement.entries
                    : [];


            // ------------------------------------------------
            // MUST HAVE TWO ENTRIES
            // ------------------------------------------------

            if (
                taskEntries.length !== 2
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Double lesson does not contain exactly two generated entries.",
                    {
                        taskId:
                            task.taskId,

                        actualEntries:
                            taskEntries.length

                    }
                );


                return;

            }


            const first =
                normalizeGeneratedTimetableEntry(
                    taskEntries[0]
                );


            const second =
                normalizeGeneratedTimetableEntry(
                    taskEntries[1]
                );


            if (
                !first ||
                !second
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Double lesson contains an invalid generated entry.",
                    {
                        taskId:
                            task.taskId

                    }
                );


                return;

            }


            const firstPeriod =
                lookups.periods.get(
                    first.periodId
                );


            const secondPeriod =
                lookups.periods.get(
                    second.periodId
                );


            if (
                !firstPeriod ||
                !secondPeriod
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Double lesson references a missing period.",
                    {
                        taskId:
                            task.taskId

                    }
                );


                return;

            }


            // ------------------------------------------------
            // SAME DAY
            // ------------------------------------------------

            if (
                Number(firstPeriod.dayNumber) !==
                Number(secondPeriod.dayNumber)
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Double lesson periods are on different days.",
                    {
                        taskId:
                            task.taskId,

                        firstPeriodId:
                            first.periodId,

                        secondPeriodId:
                            second.periodId

                    }
                );

            }


            // ------------------------------------------------
            // CONSECUTIVE
            // ------------------------------------------------

            if (
                !arePeriodsConsecutive(
                    firstPeriod,
                    secondPeriod
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Double lesson periods are not consecutive.",
                    {
                        taskId:
                            task.taskId,

                        firstPeriodId:
                            first.periodId,

                        secondPeriodId:
                            second.periodId

                    }
                );

            }


            // ------------------------------------------------
            // SAME ROOM
            // ------------------------------------------------

            if (
                first.roomId !==
                second.roomId
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Double lesson changes room between its two periods.",
                    {
                        taskId:
                            task.taskId,

                        firstRoomId:
                            first.roomId,

                        secondRoomId:
                            second.roomId

                    }
                );

            }


            // ------------------------------------------------
            // SAME STREAM
            // ------------------------------------------------

            if (
                first.streamId !==
                second.streamId
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Double lesson changes stream between its two periods.",
                    {
                        taskId:
                            task.taskId

                    }
                );

            }


            // ------------------------------------------------
            // SAME SUBJECT
            // ------------------------------------------------

            if (
                first.subjectId !==
                second.subjectId
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Double lesson changes subject between its two periods.",
                    {
                        taskId:
                            task.taskId

                    }
                );

            }


            // ------------------------------------------------
            // SAME TEACHER
            // ------------------------------------------------

            if (
                first.teacherId !==
                second.teacherId
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Double lesson changes teacher between its two periods.",
                    {
                        taskId:
                            task.taskId

                    }
                );

            }

        }
    );

}


// ============================================================
// AUDIT ROOM TYPE REQUIREMENTS
// ============================================================

function auditRoomTypeRequirements(
    data,
    entries,
    audit,
    lookups
) {

    entries.forEach(
        (
            entry,
            index
        ) => {

            const normalized =
                normalizeGeneratedTimetableEntry(
                    entry
                );


            if (
                !normalized
            ) {

                return;

            }


            // ------------------------------------------------
            // MATCH REQUIREMENT
            // ------------------------------------------------

            const matchingRequirements =
                (data.requirements || [])
                    .filter(
                        requirement => {

                            if (
                                normalizeTimetableId(
                                    requirement.streamId
                                ) !==
                                normalized.streamId
                            ) {

                                return false;

                            }


                            if (
                                normalizeTimetableId(
                                    requirement.subjectId
                                ) !==
                                normalized.subjectId
                            ) {

                                return false;

                            }


                            const requirementTeacherId =
                                normalizeTimetableId(
                                    requirement.teacherId
                                );


                            return (
                                !requirementTeacherId ||
                                requirementTeacherId ===
                                normalized.teacherId
                            );

                        }
                    );


            if (
                matchingRequirements.length !== 1
            ) {

                return;

            }


            const requirement =
                matchingRequirements[0];


            // ------------------------------------------------
            // NO ROOM REQUIRED
            // ------------------------------------------------

            if (
                !requirement.requiresRoom
            ) {

                return;

            }


            // ------------------------------------------------
            // ROOM MUST EXIST
            // ------------------------------------------------

            if (
                !normalized.roomId
            ) {

                addTimetableAuditError(
                    audit,
                    "roomTypes",
                    "Requirement requires a room but generated entry has no room.",
                    {
                        entryIndex:
                            index,

                        requirementId:
                            requirement.requirementId

                    }
                );


                return;

            }


            const room =
                lookups.rooms.get(
                    normalized.roomId
                );


            if (
                !room
            ) {

                addTimetableAuditError(
                    audit,
                    "roomTypes",
                    "Generated entry references a room that does not exist.",
                    {
                        entryIndex:
                            index,

                        roomId:
                            normalized.roomId

                    }
                );


                return;

            }


            const expectedType =
                normalizeRoomType(
                    requirement.roomType
                );


            const actualType =
                normalizeRoomType(
                    getTimetableRoomType(
                        room
                    )
                );


            if (
                expectedType &&
                expectedType !==
                actualType
            ) {

                addTimetableAuditError(
                    audit,
                    "roomTypes",
                    "Generated room does not match the requirement room type.",
                    {
                        entryIndex:
                            index,

                        requirementId:
                            requirement.requirementId,

                        expectedType,

                        actualType,

                        roomId:
                            normalized.roomId

                    }
                );

            }


            // ------------------------------------------------
            // ROOM AVAILABILITY FLAG
            // ------------------------------------------------

            if (
                room.available === false
            ) {

                addTimetableAuditError(
                    audit,
                    "roomTypes",
                    "Generated timetable uses a room marked unavailable.",
                    {
                        entryIndex:
                            index,

                        roomId:
                            normalized.roomId

                    }
                );

            }

        }
    );

}


// ============================================================
// AUDIT BASIC ENTITY REFERENCES
// ============================================================

function auditGeneratedEntityReferences(
    entries,
    audit,
    lookups
) {

    entries.forEach(
        (
            entry,
            index
        ) => {

            const normalized =
                normalizeGeneratedTimetableEntry(
                    entry
                );


            if (
                !normalized
            ) {

                return;

            }


            // ------------------------------------------------
            // STREAM
            // ------------------------------------------------

            if (
                !normalized.streamId ||
                !lookups.streams.has(
                    normalized.streamId
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "periodReferences",
                    "Generated entry references an invalid stream.",
                    {
                        entryIndex:
                            index,

                        streamId:
                            normalized.streamId

                    }
                );

            }


            // ------------------------------------------------
            // SUBJECT
            // ------------------------------------------------

            if (
                !normalized.subjectId ||
                !lookups.subjects.has(
                    normalized.subjectId
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "periodReferences",
                    "Generated entry references an invalid subject.",
                    {
                        entryIndex:
                            index,

                        subjectId:
                            normalized.subjectId

                    }
                );

            }


            // ------------------------------------------------
            // TEACHER
            // ------------------------------------------------

            if (
                normalized.teacherId &&
                !lookups.teachers.has(
                    normalized.teacherId
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "periodReferences",
                    "Generated entry references an invalid teacher.",
                    {
                        entryIndex:
                            index,

                        teacherId:
                            normalized.teacherId

                    }
                );

            }


            // ------------------------------------------------
            // ROOM
            // ------------------------------------------------

            if (
                normalized.roomId &&
                !lookups.rooms.has(
                    normalized.roomId
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "periodReferences",
                    "Generated entry references an invalid room.",
                    {
                        entryIndex:
                            index,

                        roomId:
                            normalized.roomId

                    }
                );

            }

        }
    );

}


// ============================================================
// BUILD HUMAN-READABLE AUDIT TABLE
// ============================================================

function buildTimetableAuditEntryTable(
    result,
    lookups
) {

    const rows = [];


    (result?.placedTasks || [])
        .forEach(
            placement => {

                const task =
                    placement?.task;


                const entries =
                    Array.isArray(
                        placement?.entries
                    )
                        ? placement.entries
                        : [];


                entries.forEach(
                    entry => {

                        const normalized =
                            normalizeGeneratedTimetableEntry(
                                entry
                            );


                        if (
                            !normalized
                        ) {

                            return;

                        }


                        const period =
                            lookups.periods.get(
                                normalized.periodId
                            );


                        const stream =
                            lookups.streams.get(
                                normalized.streamId
                            );


                        const subject =
                            lookups.subjects.get(
                                normalized.subjectId
                            );


                        const teacher =
                            normalized.teacherId
                                ? lookups.teachers.get(
                                    normalized.teacherId
                                )
                                : null;


                        const room =
                            normalized.roomId
                                ? lookups.rooms.get(
                                    normalized.roomId
                                )
                                : null;


                        rows.push({

                            taskId:
                                task?.taskId ||
                                null,

                            type:
                                task?.taskType ||
                                null,

                            day:
                                period?.dayName ||
                                period?.dayNumber ||
                                null,

                            period:
                                period?.periodNumber ||
                                null,

                            periodOrder:
                                period?.periodOrder ||
                                null,

                            stream:
                                getTimetableStreamName(
                                    stream
                                ) ||
                                normalized.streamId,

                            subject:
                                getTimetableSubjectName(
                                    subject
                                ) ||
                                normalized.subjectId,

                            teacher:
                                teacher
                                    ? getTimetableTeacherName(
                                        teacher
                                    )
                                    : "Unassigned",

                            room:
                                room?.name ||
                                room?.room_name ||
                                normalized.roomId ||
                                "None"

                        });

                    }
                );

            }
        );


    return rows;

}


// ============================================================
// RUN COMPLETE STAGE 6G AUDIT
// ============================================================

function auditGeneratedTimetable(
    data,
    result
) {

    console.log(
        "======================================"
    );

    console.log(
        "STAGE 6G — FINAL TIMETABLE CONSTRAINT AUDIT"
    );

    console.log(
        "======================================"
    );


    // ========================================================
    // BASIC INPUT VALIDATION
    // ========================================================

    if (
        !data ||
        !result
    ) {

        throw new Error(
            "Cannot audit timetable: data or generation result is missing."
        );

    }


    const audit =
        createTimetableAuditResult();


    const entries =
        Array.isArray(
            result.entries
        )
            ? result.entries
            : [];


    audit.statistics.totalEntries =
        entries.length;


    audit.statistics.totalTasks =
        Array.isArray(
            data.lessonTasks
        )
            ? data.lessonTasks.length
            : 0;


    audit.statistics.placedTasks =
        result.statistics?.placedTasks ||
        0;


    audit.statistics.failedTasks =
        result.statistics?.failedTasks ||
        0;


    const lookups =
        buildTimetableAuditLookups(
            data
        );


    audit.statistics.auditedPeriods =
        lookups.periods.size;


    audit.statistics.auditedRequirements =
        lookups.requirements.size;


    audit.statistics.auditedTeachers =
        lookups.teachers.size;


    audit.statistics.auditedRooms =
        lookups.rooms.size;


    // ========================================================
    // 1. PERIOD REFERENCES
    // ========================================================

    auditGeneratedPeriodReferences(
        entries,
        lookups,
        audit
    );


    auditGeneratedEntityReferences(
        entries,
        audit,
        lookups
    );


    // ========================================================
    // 2. DUPLICATE ENTRIES
    // ========================================================

    auditDuplicateGeneratedEntries(
        entries,
        audit
    );


    // ========================================================
    // 3. STREAM CONFLICTS
    // ========================================================

    auditStreamPeriodConflicts(
        entries,
        audit
    );


    // ========================================================
    // 4. TEACHER CONFLICTS
    // ========================================================

    auditTeacherPeriodConflicts(
        entries,
        audit
    );


    // ========================================================
    // 5. ROOM CONFLICTS
    // ========================================================

    auditRoomPeriodConflicts(
        entries,
        audit
    );


    // ========================================================
    // 6. REQUIREMENT WEEKLY TOTALS
    // ========================================================

    auditRequirementWeeklyTotals(
        data,
        entries,
        audit
    );


    // ========================================================
    // 7. DAILY REQUIREMENT LIMITS
    // ========================================================

    auditDailyRequirementLimits(
        data,
        entries,
        audit,
        lookups
    );


    // ========================================================
    // 8. TEACHER DAILY LIMITS
    // ========================================================

    auditTeacherDailyLimits(
        data,
        entries,
        audit,
        lookups
    );


    // ========================================================
    // 9. TEACHER WEEKLY LIMITS
    // ========================================================

    auditTeacherWeeklyLimits(
        entries,
        audit,
        lookups
    );


    // ========================================================
    // 10. TEACHER CONSECUTIVE LIMITS
    // ========================================================

    auditTeacherConsecutiveLimits(
        entries,
        audit,
        lookups
    );


    // ========================================================
    // 11. DOUBLE LESSON STRUCTURE
    // ========================================================

    auditDoubleLessonStructure(
        data,
        result,
        audit,
        lookups
    );


    // ========================================================
    // 12. ROOM TYPE REQUIREMENTS
    // ========================================================

    auditRoomTypeRequirements(
        data,
        entries,
        audit,
        lookups
    );


    // ========================================================
    // BUILD HUMAN-READABLE TABLE
    // ========================================================

    const entryTable =
        buildTimetableAuditEntryTable(
            result,
            lookups
        );


    // ========================================================
    // SUMMARY
    // ========================================================

    console.log(
        "======================================"
    );

    console.log(
        "STAGE 6G — AUDIT SUMMARY"
    );

    console.log(
        "======================================"
    );


    console.log(
        "Total generated entries:",
        audit.statistics.totalEntries
    );


    console.log(
        "Total tasks:",
        audit.statistics.totalTasks
    );


    console.log(
        "Placed tasks:",
        audit.statistics.placedTasks
    );


    console.log(
        "Failed tasks:",
        audit.statistics.failedTasks
    );


    console.log(
        "Errors:",
        audit.errors.length
    );


    console.log(
        "Warnings:",
        audit.warnings.length
    );


    console.log(
        "======================================"
    );


    // ========================================================
    // CHECK STATUS
    // ========================================================

    console.table({

        "Requirement weekly totals":
            audit.checks.requirementTotals,

        "Double lessons":
            audit.checks.doubleLessons,

        "Stream conflicts":
            audit.checks.streamConflicts,

        "Teacher conflicts":
            audit.checks.teacherConflicts,

        "Room conflicts":
            audit.checks.roomConflicts,

        "Daily requirement limits":
            audit.checks.dailyRequirementLimits,

        "Teacher daily limits":
            audit.checks.teacherDailyLimits,

        "Teacher weekly limits":
            audit.checks.teacherWeeklyLimits,

        "Teacher consecutive limits":
            audit.checks.teacherConsecutiveLimits,

        "Room types":
            audit.checks.roomTypes,

        "Duplicate entries":
            audit.checks.duplicateEntries,

        "Period references":
            audit.checks.periodReferences

    });


    // ========================================================
    // HUMAN-READABLE GENERATED TABLE
    // ========================================================

    if (
        entryTable.length > 0
    ) {

        console.log(
            "======================================"
        );

        console.log(
            "GENERATED TIMETABLE AUDIT TABLE"
        );

        console.log(
            "======================================"
        );


        console.table(
            entryTable
        );

    }


    // ========================================================
    // ERROR TABLE
    // ========================================================

    if (
        audit.errors.length > 0
    ) {

        console.log(
            "======================================"
        );

        console.error(
            "TIMETABLE AUDIT ERRORS"
        );

        console.log(
            "======================================"
        );


        console.table(
            audit.errors
        );

    }


    // ========================================================
    // WARNING TABLE
    // ========================================================

    if (
        audit.warnings.length > 0
    ) {

        console.log(
            "======================================"
        );

        console.warn(
            "TIMETABLE AUDIT WARNINGS"
        );

        console.log(
            "======================================"
        );


        console.table(
            audit.warnings
        );

    }


    // ========================================================
    // FINAL STATUS
    // ========================================================

    if (
        audit.valid
    ) {

        console.log(
            "======================================"
        );

        console.log(
            "✅ TIMETABLE AUDIT PASSED"
        );

        console.log(
            "======================================"
        );

    }
    else {

        console.error(
            "======================================"
        );

        console.error(
            "❌ TIMETABLE AUDIT FAILED"
        );

        console.error(
            "======================================"
        );

    }


    return audit;

}























// ============================================================
// STAGE 7 — REPAIR / BACKTRACKING ENGINE
// ============================================================
//
// PURPOSE:
//
// Stage 6 performs normal placement.
//
// Stage 7 handles tasks that Stage 6 could not place.
//
// It will:
//
// 1. Take failed tasks.
// 2. Search alternative periods.
// 3. Search alternative rooms.
// 4. Try to move an already placed lesson if necessary.
// 5. Re-attempt the failed task.
// 6. Repeat for a limited number of repair passes.
//
// IMPORTANT:
//
// This stage does NOT generate new tasks.
// This stage does NOT create timetable periods.
// This stage does NOT render the timetable.
//
// It only repairs the scheduling result.
// ============================================================


// ============================================================
// STAGE 7 CONFIGURATION
// ============================================================

const STAGE7_CONFIG = {

    maxRepairPasses: 5,

    maxMovesPerTask: 8,

    maxCandidatesPerTask: 50,

    allowMovingSingleLessons: true,

    allowMovingDoubleLessons: false

};


// ============================================================
// STAGE 7 — MAIN ENTRY POINT
// ============================================================

function runStage7Repair(
    failedTasks,
    placedTasks,
    generatorData
) {

    console.log(
        "======================================"
    );

    console.log(
        "STAGE 7 — REPAIR / BACKTRACKING"
    );

    console.log(
        "======================================"
    );


    if (
        !Array.isArray(
            failedTasks
        ) ||
        failedTasks.length === 0
    ) {

        console.log(
            "STAGE 7: No failed tasks. Repair not required."
        );

        return {

            repaired:
                [],

            stillFailed:
                [],

            moved:
                [],

            repairedCount:
                0,

            failedCount:
                0

        };

    }


    if (
        !generatorData
    ) {

        console.error(
            "STAGE 7: generatorData missing."
        );

        return {

            repaired:
                [],

            stillFailed:
                failedTasks,

            moved:
                [],

            repairedCount:
                0,

            failedCount:
                failedTasks.length

        };

    }


    const indexes =
        generatorData.indexes;


    if (
        !indexes
    ) {

        console.error(
            "STAGE 7: Occupancy indexes missing."
        );

        return {

            repaired:
                [],

            stillFailed:
                failedTasks,

            moved:
                [],

            repairedCount:
                0,

            failedCount:
                failedTasks.length

        };

    }


    const repaired = [];

    const stillFailed = [];

    const moved = [];


    // --------------------------------------------------------
    // WORKING COPY
    // --------------------------------------------------------

    let remainingTasks =
        [...failedTasks];


    // --------------------------------------------------------
    // REPAIR PASSES
    // --------------------------------------------------------

    for (
        let pass = 1;
        pass <= STAGE7_CONFIG.maxRepairPasses;
        pass++
    ) {

        console.log(
            `STAGE 7 REPAIR PASS ${pass}`
        );


        if (
            remainingTasks.length === 0
        ) {

            break;

        }


        const nextFailed = [];


        for (
            const task of remainingTasks
        ) {

            console.log(
                "Attempting repair:",
                task?.taskId ||
                task?.id
            );


            const result =
                repairSingleFailedTask(
                    task,
                    generatorData
                );


            if (
                result &&
                result.repaired
            ) {

                repaired.push(
                    task
                );


                if (
                    Array.isArray(
                        result.moved
                    )
                ) {

                    moved.push(
                        ...result.moved
                    );

                }


                console.log(
                    "✅ STAGE 7 REPAIRED:",
                    task?.taskId ||
                    task?.id
                );

            }
            else {

                nextFailed.push(
                    task
                );

            }

        }


        remainingTasks =
            nextFailed;


        console.log(
            `STAGE 7 PASS ${pass}:`,
            {
                repaired:
                    repaired.length,

                remaining:
                    remainingTasks.length,

                moved:
                    moved.length
            }
        );


        if (
            remainingTasks.length === 0
        ) {

            break;

        }

    }


    stillFailed.push(
        ...remainingTasks
    );


    console.log(
        "======================================"
    );

    console.log(
        "STAGE 7 COMPLETE"
    );

    console.log(
        "======================================"
    );


    console.log(
        "Repaired:",
        repaired.length
    );

    console.log(
        "Moved:",
        moved.length
    );

    console.log(
        "Still failed:",
        stillFailed.length
    );


    return {

        repaired,

        stillFailed,

        moved,

        repairedCount:
            repaired.length,

        failedCount:
            stillFailed.length

    };

}


// ============================================================
// REPAIR ONE FAILED TASK
// ============================================================

function repairSingleFailedTask(
    task,
    generatorData
) {

    if (
        !task ||
        !generatorData
    ) {

        return {

            repaired:
                false,

            moved:
                []

        };

    }


    const periods =
        generatorData.periods ||
        [];


    const rooms =
        generatorData.rooms ||
        [];


    const indexes =
        generatorData.indexes;


    if (
        !indexes
    ) {

        return {

            repaired:
                false,

            moved:
                []

        };

    }


    // ========================================================
    // BUILD PERIOD CANDIDATES
    // ========================================================

    const candidatePeriods =
        buildStage7PeriodCandidates(
            task,
            periods
        );


    if (
        candidatePeriods.length === 0
    ) {

        return {

            repaired:
                false,

            moved:
                []

        };

    }


    let attempts = 0;


    // ========================================================
    // TRY EMPTY / VALID SLOTS FIRST
    // ========================================================

    for (
        const period of candidatePeriods
    ) {

        if (
            attempts >=
            STAGE7_CONFIG.maxCandidatesPerTask
        ) {

            break;

        }


        attempts++;


        const candidateRooms =
            buildStage7RoomCandidates(
                task,
                rooms
            );


        for (
            const room of candidateRooms
        ) {

            const conflict =
                checkSingleSlotConflict(
                    task,
                    period,
                    room,
                    indexes
                );


            if (
                conflict &&
                conflict.valid === true
            ) {

                const placed =
                    placeStage7Task(
                        task,
                        period,
                        room,
                        generatorData
                    );


                if (
                    placed
                ) {

                    return {

                        repaired:
                            true,

                        moved:
                            []

                    };

                }

            }

        }

    }


    // ========================================================
    // NO DIRECT SLOT
    // TRY MOVING AN EXISTING SINGLE LESSON
    // ========================================================

    if (
        STAGE7_CONFIG.allowMovingSingleLessons
    ) {

        const moveResult =
            attemptStage7Relocation(
                task,
                candidatePeriods,
                rooms,
                generatorData
            );


        if (
            moveResult &&
            moveResult.repaired
        ) {

            return moveResult;

        }

    }


    return {

        repaired:
            false,

        moved:
            []

    };

}

// ============================================================
// BUILD STAGE 7 PERIOD CANDIDATES
// ============================================================

function buildStage7PeriodCandidates(
    task,
    periods
) {

    if (
        !Array.isArray(periods)
    ) {

        return [];

    }


    const candidates =
        periods
            .filter(
                period =>
                    period &&
                    period.id
            )
            .sort(
                (
                    a,
                    b
                ) => {

                    const dayA =
                        Number(
                            a.day_number || 0
                        );

                    const dayB =
                        Number(
                            b.day_number || 0
                        );


                    if (
                        dayA !== dayB
                    ) {

                        return (
                            dayA - dayB
                        );

                    }


                    const orderA =
                        Number(
                            a.period_order ??
                            a.period_number ??
                            0
                        );


                    const orderB =
                        Number(
                            b.period_order ??
                            b.period_number ??
                            0
                        );


                    return (
                        orderA - orderB
                    );

                }
            );


    return candidates;

}

// ============================================================
// BUILD STAGE 7 ROOM CANDIDATES
// ============================================================

function buildStage7RoomCandidates(
    task,
    rooms
) {

    if (
        !Array.isArray(rooms)
    ) {

        return [null];

    }


    // --------------------------------------------------------
    // Subjects that do not require rooms
    // --------------------------------------------------------

    if (
        task.requiresRoom !== true &&
        task.requires_room !== true
    ) {

        return [null];

    }


    const validRooms =
        rooms.filter(
            room =>
                room &&
                room.id
        );


    if (
        validRooms.length === 0
    ) {

        return [null];

    }


    return validRooms;

}

// ============================================================
// STAGE 7 TASK PLACEMENT ADAPTER
// ============================================================

function placeStage7Task(
    task,
    period,
    room,
    generatorData
) {

    if (
        !task ||
        !period ||
        !generatorData
    ) {

        return false;

    }


    // --------------------------------------------------------
    // REUSE EXISTING PLACEMENT ENGINE
    // --------------------------------------------------------

    if (
        typeof placeTaskInSlot ===
        "function"
    ) {

        return Boolean(
            placeTaskInSlot(
                task,
                period,
                room,
                generatorData
            )
        );

    }


    if (
        typeof placeSingleTask ===
        "function"
    ) {

        return Boolean(
            placeSingleTask(
                task,
                period,
                room,
                generatorData
            )
        );

    }


    console.error(
        "STAGE 7: Existing placement function not found."
    );


    return false;

}


// ============================================================
// STAGE 7 — RELOCATION
// ============================================================

function attemptStage7Relocation(
    failedTask,
    candidatePeriods,
    rooms,
    generatorData
) {

    if (
        !failedTask ||
        !Array.isArray(candidatePeriods)
    ) {

        return {

            repaired:
                false,

            moved:
                []

        };

    }


    const placedTasks =
        generatorData.placedTasks ||
        [];


    if (
        !Array.isArray(placedTasks) ||
        placedTasks.length === 0
    ) {

        return {

            repaired:
                false,

            moved:
                []

        };

    }


    let moveAttempts = 0;


    // ========================================================
    // LOOK FOR A SINGLE LESSON TO MOVE
    // ========================================================

    for (
        const existingTask of placedTasks
    ) {

        if (
            moveAttempts >=
            STAGE7_CONFIG.maxMovesPerTask
        ) {

            break;

        }


        // ----------------------------------------------------
        // NEVER MOVE A DOUBLE LESSON IN THIS PASS
        // ----------------------------------------------------

        if (
            existingTask.type === "double" ||
            existingTask.isDouble === true
        ) {

            continue;

        }


        moveAttempts++;


        // ----------------------------------------------------
        // FIND A NEW LOCATION FOR EXISTING TASK
        // ----------------------------------------------------

        const alternative =
            findAlternativeSlotForExistingTask(
                existingTask,
                failedTask,
                candidatePeriods,
                rooms,
                generatorData
            );


        if (
            !alternative
        ) {

            continue;

        }


        // ----------------------------------------------------
        // MOVE EXISTING TASK
        // ----------------------------------------------------

        const moved =
            moveStage7Task(
                existingTask,
                alternative.period,
                alternative.room,
                generatorData
            );


        if (
            !moved
        ) {

            continue;

        }


        // ----------------------------------------------------
        // NOW TRY FAILED TASK
        // ----------------------------------------------------

        const placed =
            placeStage7Task(
                failedTask,
                alternative.oldPeriod,
                alternative.oldRoom,
                generatorData
            );


        if (
            placed
        ) {

            return {

                repaired:
                    true,

                moved: [
                    {
                        task:
                            existingTask,

                        from:
                            {
                                period:
                                    alternative.oldPeriod,

                                room:
                                    alternative.oldRoom
                            },

                        to:
                            {
                                period:
                                    alternative.period,

                                room:
                                    alternative.room
                            }
                    }
                ]

            };

        }


        // ----------------------------------------------------
        // FAILED TO PLACE FAILED TASK
        // ROLLBACK
        // ----------------------------------------------------

        moveStage7Task(
            existingTask,
            alternative.oldPeriod,
            alternative.oldRoom,
            generatorData
        );

    }


    return {

        repaired:
            false,

        moved:
            []

    };

}


// ============================================================
// FIND ALTERNATIVE SLOT FOR EXISTING TASK
// ============================================================

function findAlternativeSlotForExistingTask(
    existingTask,
    failedTask,
    candidatePeriods,
    rooms,
    generatorData
) {

    if (
        !existingTask ||
        !failedTask
    ) {

        return null;

    }


    const indexes =
        generatorData.indexes;


    if (
        !indexes
    ) {

        return null;

    }


    const oldPeriod =
        findTaskPeriod(
            existingTask,
            generatorData
        );


    const oldRoom =
        findTaskRoom(
            existingTask,
            generatorData
        );


    if (
        !oldPeriod
    ) {

        return null;

    }


    for (
        const period of candidatePeriods
    ) {

        // Do not return the same slot.
        if (
            String(period.id) ===
            String(oldPeriod.id)
        ) {

            continue;

        }


        const candidateRooms =
            buildStage7RoomCandidates(
                existingTask,
                rooms
            );


        for (
            const room of candidateRooms
        ) {

            const conflict =
                checkSingleSlotConflict(
                    existingTask,
                    period,
                    room,
                    indexes
                );


            if (
                conflict &&
                conflict.valid === true
            ) {

                return {

                    period,

                    room,

                    oldPeriod,

                    oldRoom

                };

            }

        }

    }


    return null;

}

// ============================================================
// FIND CURRENT PERIOD OF TASK
// ============================================================

function findTaskPeriod(
    task,
    generatorData
) {

    const periods =
        generatorData.periods ||
        [];


    if (
        task.periodId
    ) {

        return periods.find(
            period =>
                String(period.id) ===
                String(task.periodId)
        ) || null;

    }


    if (
        task.period_id
    ) {

        return periods.find(
            period =>
                String(period.id) ===
                String(task.period_id)
        ) || null;

    }


    return null;

}


// ============================================================
// FIND CURRENT ROOM OF TASK
// ============================================================

function findTaskRoom(
    task,
    generatorData
) {

    const rooms =
        generatorData.rooms ||
        [];


    const roomId =
        task.roomId ||
        task.room_id ||
        null;


    if (
        !roomId
    ) {

        return null;

    }


    return rooms.find(
        room =>
            String(room.id) ===
            String(roomId)
    ) || null;

}

// ============================================================
// STAGE 7 — MOVE TASK
// ============================================================

function moveStage7Task(
    task,
    newPeriod,
    newRoom,
    generatorData
) {

    if (
        !task ||
        !newPeriod
    ) {

        return false;

    }


    // --------------------------------------------------------
    // PREFER EXISTING MOVE FUNCTION
    // --------------------------------------------------------

    if (
        typeof moveTaskToSlot ===
        "function"
    ) {

        return Boolean(
            moveTaskToSlot(
                task,
                newPeriod,
                newRoom,
                generatorData
            )
        );

    }


    // --------------------------------------------------------
    // OTHERWISE USE EXISTING REMOVE + PLACE
    // --------------------------------------------------------

    if (
        typeof removeTaskFromSlot ===
            "function" &&
        typeof placeTaskInSlot ===
            "function"
    ) {

        const removed =
            removeTaskFromSlot(
                task,
                generatorData
            );


        if (
            !removed
        ) {

            return false;

        }


        const placed =
            placeTaskInSlot(
                task,
                newPeriod,
                newRoom,
                generatorData
            );


        if (
            placed
        ) {

            return true;

        }


        // ----------------------------------------------------
        // ROLLBACK
        // ----------------------------------------------------

        placeTaskInSlot(
            task,
            findTaskPeriod(
                task,
                generatorData
            ),
            findTaskRoom(
                task,
                generatorData
            ),
            generatorData
        );


        return false;

    }


    console.error(
        "STAGE 7: No task movement implementation available."
    );


    return false;

}














































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
        timetableState?.schoolId
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
        // 2–6. LOAD DISPLAY DATA IN PARALLEL
        // ====================================================

        const [
            periodsResult,
            streamsResult,
            subjectsResult,
            teachersResult,
            roomsResult
        ] = await Promise.all([

            supabaseClient
                .from("timetable_periods")
                .select("*")
                .eq(
                    "school_id",
                    timetableState.schoolId
                ),

            supabaseClient
                .from("timetable_streams")
                .select("*")
                .eq(
                    "school_id",
                    timetableState.schoolId
                ),

            supabaseClient
                .from("timetable_subjects")
                .select("*")
                .eq(
                    "school_id",
                    timetableState.schoolId
                ),

            supabaseClient
                .from("timetable_teachers")
                .select("*")
                .eq(
                    "school_id",
                    timetableState.schoolId
                ),

            supabaseClient
                .from("timetable_rooms")
                .select("*")
                .eq(
                    "school_id",
                    timetableState.schoolId
                )

        ]);


        // ====================================================
        // CHECK PARALLEL LOAD ERRORS
        // ====================================================

        if (
            periodsResult.error
        ) {

            throw new Error(
                "Failed to load timetable periods: " +
                periodsResult.error.message
            );

        }


        if (
            streamsResult.error
        ) {

            throw new Error(
                "Failed to load timetable streams: " +
                streamsResult.error.message
            );

        }


        if (
            subjectsResult.error
        ) {

            throw new Error(
                "Failed to load timetable subjects: " +
                subjectsResult.error.message
            );

        }


        if (
            teachersResult.error
        ) {

            throw new Error(
                "Failed to load timetable teachers: " +
                teachersResult.error.message
            );

        }


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
        // 8. VALIDATE LOADED ENTRIES
        // ====================================================

        const invalidEntries =
            entries.filter(
                entry =>
                    !entry.id ||
                    !entry.period_id ||
                    !entry.stream_id ||
                    !entry.subject_id ||
                    !entry.teacher_id
            );


        if (
            invalidEntries.length > 0
        ) {

            console.warn(
                "Invalid timetable entries detected:",
                invalidEntries
            );

        }


        console.log(
            "Valid timetable entries:",
            entries.length -
            invalidEntries.length
        );


        // ====================================================
        // 9. SAVE ENTRIES IN GLOBAL STATE
        // ====================================================

        generatedTimetableEntries =
            entries;


        // ====================================================
        // 10. RENDER
        // ====================================================

        renderGeneratedTimetable(
            entries,
            lookup
        );


        console.log(
            "TIMETABLE DISPLAY COMPLETE"
        );

        console.log(
            "======================================"
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


    // ========================================================
    // VALIDATE INPUT
    // ========================================================

    if (
        !Array.isArray(entries) ||
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


    if (
        !lookup ||
        !lookup.periods ||
        !lookup.streams ||
        !lookup.subjects ||
        !lookup.teachers ||
        !lookup.rooms
    ) {

        console.error(
            "Incomplete timetable lookup maps."
        );

        container.innerHTML = `
            <div class="empty-state">

                <div>⚠️</div>

                <h3>
                    Unable to display timetable.
                </h3>

                <p>
                    Timetable reference data is incomplete.
                </p>

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
    // DAY → PERIOD ORDER
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

                    return (
                        dayA - dayB
                    );

                }


                const orderA =
                    Number(
                        periodA?.period_order ||
                        periodA?.period_number ||
                        0
                    );

                const orderB =
                    Number(
                        periodB?.period_order ||
                        periodB?.period_number ||
                        0
                    );


                if (
                    orderA !== orderB
                ) {

                    return (
                        orderA - orderB
                    );

                }


                // Stable fallback
                return String(
                    a.id || ""
                ).localeCompare(
                    String(
                        b.id || ""
                    )
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
    // SORT STREAMS
    // ========================================================

    const sortedStreamGroups =
        [...streamGroups.entries()]
            .sort(
                (
                    [streamIdA],
                    [streamIdB]
                ) => {

                    const streamA =
                        lookup.streams.get(
                            streamIdA
                        );

                    const streamB =
                        lookup.streams.get(
                            streamIdB
                        );


                    const nameA =
                        getTimetableStreamName(
                            streamA
                        );


                    const nameB =
                        getTimetableStreamName(
                            streamB
                        );


                    return String(
                        nameA
                    ).localeCompare(
                        String(
                            nameB
                        ),
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

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

    sortedStreamGroups.forEach(
        (
            [streamId, streamEntries]
        ) => {

            const stream =
                lookup.streams.get(
                    streamId
                );


            const streamName =
                getTimetableStreamName(
                    stream
                ) ||
                "Unknown Stream";


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
                        entry.room_id
                            ? lookup.rooms.get(
                                entry.room_id
                            )
                            : null;


                    // ------------------------------------------------
                    // DAY
                    // ------------------------------------------------

                    const day =
                        period?.day_name ||
                        (
                            period?.day_number
                                ? `Day ${period.day_number}`
                                : "Unknown"
                        );


                    // ------------------------------------------------
                    // PERIOD
                    // ------------------------------------------------

                    const periodNumber =
                        period?.period_number ??
                        period?.period_order ??
                        "-";


                    // ------------------------------------------------
                    // TIME
                    // ------------------------------------------------

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


                    // ------------------------------------------------
                    // DISPLAY NAMES
                    // ------------------------------------------------

                    const subjectName =
                        getTimetableSubjectName(
                            subject
                        ) ||
                        "Unknown Subject";


                    const teacherName =
                        getTimetableTeacherName(
                            teacher
                        ) ||
                        "Unknown Teacher";


                    const roomName =
                        entry.room_id
                            ? (
                                getTimetableRoomName(
                                    room
                                ) ||
                                "Unknown Room"
                            )
                            : "None";


                    // ------------------------------------------------
                    // RENDER ROW
                    // ------------------------------------------------

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
                                        subjectName
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(
                                    teacherName
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    roomName
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


    // ========================================================
    // CLOSE MAIN CONTAINER
    // ========================================================

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

    console.log(
        "Streams rendered:",
        sortedStreamGroups.length
    );

    console.log(
        "Entries rendered:",
        sortedEntries.length
    );

}
```




// ============================================================
// SHARED TIMETABLE ENTRY SORTER
// ============================================================

function sortTimetableEntries(
    entries,
    lookup
) {

    return [...entries].sort(
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

                return (
                    dayA - dayB
                );

            }


            const orderA =
                Number(
                    periodA?.period_order ??
                    periodA?.period_number ??
                    0
                );

            const orderB =
                Number(
                    periodB?.period_order ??
                    periodB?.period_number ??
                    0
                );


            if (
                orderA !== orderB
            ) {

                return (
                    orderA - orderB
                );

            }


            return String(
                a.id || ""
            ).localeCompare(
                String(
                    b.id || ""
                )
            );

        }
    );

}


// ============================================================
// RENDER BY STREAM
// ============================================================

function renderTimetableByStream(
    entries,
    lookup,
    container
) {

    if (!container) {

        console.warn(
            "renderTimetableByStream: container not found."
        );

        return;

    }


    if (
        !Array.isArray(entries) ||
        entries.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No timetable entries available.
            </div>
        `;

        return;

    }


    if (
        !lookup ||
        !lookup.streams ||
        !lookup.periods ||
        !lookup.subjects ||
        !lookup.teachers ||
        !lookup.rooms
    ) {

        console.error(
            "renderTimetableByStream: incomplete lookup maps."
        );

        return;

    }


    // --------------------------------------------------------
    // GROUP BY STREAM
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


    // --------------------------------------------------------
    // SORT STREAMS
    // --------------------------------------------------------

    const sortedStreams =
        [...streamMap.entries()]
            .sort(
                (
                    [streamIdA],
                    [streamIdB]
                ) => {

                    const streamA =
                        lookup.streams.get(
                            streamIdA
                        );

                    const streamB =
                        lookup.streams.get(
                            streamIdB
                        );


                    return String(
                        getTimetableStreamName(
                            streamA
                        ) || ""
                    ).localeCompare(
                        String(
                            getTimetableStreamName(
                                streamB
                            ) || ""
                        ),
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

                }
            );


    let html = "";


    // --------------------------------------------------------
    // RENDER STREAMS
    // --------------------------------------------------------

    sortedStreams.forEach(
        (
            [
                streamId,
                rawEntries
            ]
        ) => {

            const stream =
                lookup.streams.get(
                    streamId
                );


            const streamName =
                getTimetableStreamName(
                    stream
                ) ||
                "Unknown Stream";


            const streamEntries =
                sortTimetableEntries(
                    rawEntries,
                    lookup
                );


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
                            : "-";


                    html += `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    String(dayName)
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(periodNumber)
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
                                        ) ||
                                        "Unknown Subject"
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(
                                    getTimetableTeacherName(
                                        teacher
                                    ) ||
                                    "Unknown Teacher"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    getTimetableRoomName(
                                        room
                                    ) ||
                                    "None"
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


    container.innerHTML =
        html;


    console.log(
        "Timetable rendered by stream:",
        sortedStreams.length
    );

}


// ============================================================
// RENDER BY TEACHER
// ============================================================

function renderTimetableByTeacher(
    entries,
    lookup,
    container
) {

    if (!container) {

        console.warn(
            "renderTimetableByTeacher: container not found."
        );

        return;

    }


    if (
        !Array.isArray(entries) ||
        entries.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No timetable entries available.
            </div>
        `;

        return;

    }


    if (
        !lookup ||
        !lookup.teachers ||
        !lookup.periods ||
        !lookup.streams ||
        !lookup.subjects ||
        !lookup.rooms
    ) {

        console.error(
            "renderTimetableByTeacher: incomplete lookup maps."
        );

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


    const sortedTeachers =
        [...teacherMap.entries()]
            .sort(
                (
                    [teacherIdA],
                    [teacherIdB]
                ) => {

                    const teacherA =
                        lookup.teachers.get(
                            teacherIdA
                        );

                    const teacherB =
                        lookup.teachers.get(
                            teacherIdB
                        );


                    return String(
                        getTimetableTeacherName(
                            teacherA
                        ) || ""
                    ).localeCompare(
                        String(
                            getTimetableTeacherName(
                                teacherB
                            ) || ""
                        ),
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

                }
            );


    let html = "";


    // --------------------------------------------------------
    // RENDER TEACHERS
    // --------------------------------------------------------

    sortedTeachers.forEach(
        (
            [
                teacherId,
                rawEntries
            ]
        ) => {

            const teacher =
                lookup.teachers.get(
                    teacherId
                );


            const teacherName =
                getTimetableTeacherName(
                    teacher
                ) ||
                "Unassigned";


            const teacherEntries =
                sortTimetableEntries(
                    rawEntries,
                    lookup
                );


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
                            : "-";


                    html += `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    String(dayName)
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(periodNumber)
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
                                    ) ||
                                    "Unknown Stream"
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${escapeHtml(
                                        getTimetableSubjectName(
                                            subject
                                        ) ||
                                        "Unknown Subject"
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(
                                    getTimetableRoomName(
                                        room
                                    ) ||
                                    "None"
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


    container.innerHTML =
        html;


    console.log(
        "Timetable rendered by teacher:",
        sortedTeachers.length
    );

}


// ============================================================
// RENDER BY ROOM
// ============================================================

function renderTimetableByRoom(
    entries,
    lookup,
    container
) {

    if (!container) {

        console.warn(
            "renderTimetableByRoom: container not found."
        );

        return;

    }


    if (
        !Array.isArray(entries) ||
        entries.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No timetable entries available.
            </div>
        `;

        return;

    }


    if (
        !lookup ||
        !lookup.rooms ||
        !lookup.periods ||
        !lookup.streams ||
        !lookup.subjects ||
        !lookup.teachers
    ) {

        console.error(
            "renderTimetableByRoom: incomplete lookup maps."
        );

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


    // --------------------------------------------------------
    // SORT ROOMS
    // --------------------------------------------------------

    const sortedRooms =
        [...roomMap.entries()]
            .sort(
                (
                    [roomIdA],
                    [roomIdB]
                ) => {

                    const roomA =
                        lookup.rooms.get(
                            roomIdA
                        );

                    const roomB =
                        lookup.rooms.get(
                            roomIdB
                        );


                    return String(
                        getTimetableRoomName(
                            roomA
                        ) || "No Room"
                    ).localeCompare(
                        String(
                            getTimetableRoomName(
                                roomB
                            ) || "No Room"
                        ),
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

                }
            );


    let html = "";


    // --------------------------------------------------------
    // RENDER ROOMS
    // --------------------------------------------------------

    sortedRooms.forEach(
        (
            [
                roomId,
                rawEntries
            ]
        ) => {

            const room =
                lookup.rooms.get(
                    roomId
                );


            const roomName =
                getTimetableRoomName(
                    room
                ) ||
                "No Room";


            const roomEntries =
                sortTimetableEntries(
                    rawEntries,
                    lookup
                );


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
                            : "-";


                    html += `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    String(dayName)
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(periodNumber)
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
                                    ) ||
                                    "Unknown Stream"
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${escapeHtml(
                                        getTimetableSubjectName(
                                            subject
                                        ) ||
                                        "Unknown Subject"
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(
                                    getTimetableTeacherName(
                                        teacher
                                    ) ||
                                    "Unknown Teacher"
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


    container.innerHTML =
        html;


    console.log(
        "Timetable rendered by room:",
        sortedRooms.length
    );

}



```javascript
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


            const streams =
                Array.isArray(
                    data.streams
                )
                    ? [...data.streams]
                    : [];


            streams.sort(
                (
                    a,
                    b
                ) => {

                    return String(
                        getTimetableStreamName(
                            a
                        ) || ""
                    ).localeCompare(
                        String(
                            getTimetableStreamName(
                                b
                            ) || ""
                        ),
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

                }
            );


            let html = `

                <option value="">
                    All Streams
                </option>

            `;


            streams.forEach(
                stream => {

                    if (
                        !stream ||
                        !stream.id
                    ) {

                        return;

                    }


                    const streamName =
                        getTimetableStreamName(
                            stream
                        ) ||
                        "Unknown Stream";


                    html += `

                        <option
                            value="${escapeHtml(
                                String(
                                    stream.id
                                )
                            )}"
                        >

                            ${escapeHtml(
                                streamName
                            )}

                        </option>

                    `;

                }
            );


            timetableStreamFilter.innerHTML =
                html;


            if (
                currentValue &&
                streams.some(
                    stream =>
                        String(
                            stream?.id
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


            const periods =
                Array.isArray(
                    data.periods
                )
                    ? data.periods
                    : [];


            const daysMap =
                new Map();


            periods.forEach(
                period => {

                    if (
                        !period ||
                        !period.day_name
                    ) {

                        return;

                    }


                    const dayName =
                        String(
                            period.day_name
                        );


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


            const days =
                [...daysMap.entries()]
                    .sort(
                        (
                            a,
                            b
                        ) => {

                            const numberDifference =
                                Number(a[1]) -
                                Number(b[1]);


                            if (
                                numberDifference !== 0
                            ) {

                                return numberDifference;

                            }


                            return String(
                                a[0]
                            ).localeCompare(
                                String(
                                    b[0]
                                )
                            );

                        }
                    );


            let html = `

                <option value="">
                    All Days
                </option>

            `;


            days.forEach(
                (
                    [
                        dayName,
                        dayNumber
                    ]
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


    const tasks =
        Math.max(
            0,
            Number(
                totalTasks
            ) || 0
        );


    const entries =
        Math.max(
            0,
            Number(
                generatedEntries
            ) || 0
        );


    const conflicts =
        Math.max(
            0,
            Number(
                conflictCount
            ) || 0
        );


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
    // NORMALIZE CONFLICTS
    // --------------------------------------------------------

    const conflictList =
        Array.isArray(
            conflicts
        )
            ? conflicts.filter(
                conflict =>
                    conflict
            )
            : [];


    // --------------------------------------------------------
    // NO CONFLICTS
    // --------------------------------------------------------

    if (
        conflictList.length === 0
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
                ${conflictList.length}
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
    // RENDER CONFLICTS
    // --------------------------------------------------------

    conflictList.forEach(
        conflict => {

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
                ) ||
                null;


            const subject =
                lookup?.subjects?.get(
                    subjectId
                ) ||
                null;


            const teacher =
                teacherId
                    ? (
                        lookup?.teachers?.get(
                            teacherId
                        ) ||
                        null
                    )
                    : null;


            // ------------------------------------------------
            // DETERMINE LESSON TYPE
            // ------------------------------------------------

            let lessonType =
                "Single";


            if (
                task?.isDouble === true ||
                task?.type === "double"
            ) {

                lessonType =
                    "Double";

            }


            const taskId =
                String(
                    conflict.taskId ||
                    task?.taskId ||
                    task?.id ||
                    ""
                );


            // Current generator format:
            // UUID-D1
            // UUID-S1
            //
            // Older format:
            // -double-

            if (
                /-D\d+$/i.test(
                    taskId
                ) ||
                taskId.includes(
                    "-double-"
                )
            ) {

                lessonType =
                    "Double";

            }


            // ------------------------------------------------
            // DISPLAY VALUES
            // ------------------------------------------------

            const streamName =
                getTimetableStreamName(
                    stream
                ) ||
                "Unknown Stream";


            const subjectName =
                getTimetableSubjectName(
                    subject
                ) ||
                "Unknown Subject";


            const teacherName =
                getTimetableTeacherName(
                    teacher
                ) ||
                "Unassigned";


            const reason =
                conflict.reason ||
                conflict.message ||
                "Unknown conflict";


            html += `

                <tr>

                    <td>
                        ${escapeHtml(
                            streamName
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            subjectName
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            teacherName
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            lessonType
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            String(
                                reason
                            )
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


    console.log(
        "Timetable conflicts displayed:",
        conflictList.length
    );

}
```


// ============================================================
// PART 7 — CLEAR & REGENERATE
// ============================================================


// ============================================================
// CLEAR GENERATED TIMETABLE
// ============================================================

async function clearGeneratedTimetable() {

    // --------------------------------------------------------
    // CHECK SCHOOL
    // --------------------------------------------------------

    if (
        !timetableState ||
        !timetableState.schoolId
    ) {

        setTimetableGenerationStatus(
            "Please select a school first.",
            "error"
        );

        return;

    }


    // --------------------------------------------------------
    // PREVENT ACTION WHILE GENERATING
    // --------------------------------------------------------

    if (
        timetableGenerationRunning
    ) {

        console.warn(
            "Cannot clear timetable while generation is running."
        );

        setTimetableGenerationStatus(
            "Please wait for timetable generation to finish.",
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


    if (!confirmed) {

        return;

    }


    try {

        setTimetableGenerationStatus(
            "Clearing timetable...",
            "info"
        );


        const schoolId =
            timetableState.schoolId;


        console.log(
            "Clearing timetable for school:",
            schoolId
        );


        // ----------------------------------------------------
        // DELETE GENERATED ENTRIES ONLY
        // ----------------------------------------------------

        const {
            error
        } =
            await supabaseClient
                .from(
                    "timetable_entries"
                )
                .delete()
                .eq(
                    "school_id",
                    schoolId
                );


        if (error) {

            throw new Error(
                error.message
            );

        }


        // ----------------------------------------------------
        // CLEAR LOCAL STATE
        // ----------------------------------------------------

        generatedTimetableEntries = [];


        // ----------------------------------------------------
        // CLEAR DISPLAY
        // ----------------------------------------------------

        const container =
            document.getElementById(
                "timetableContent"
            );


        if (container) {

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

        }


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

        const conflicts =
            document.getElementById(
                "timetableConflicts"
            );


        if (conflicts) {

            conflicts.style.display =
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
        // SUCCESS
        // ----------------------------------------------------

        setTimetableGenerationStatus(
            "Timetable cleared successfully.",
            "success"
        );


        console.log(
            "TIMETABLE CLEARED SUCCESSFULLY"
        );

    }

    catch (error) {

        console.error(
            "FAILED TO CLEAR TIMETABLE:",
            error
        );


        setTimetableGenerationStatus(
            "Failed to clear timetable: " +
            (
                error.message ||
                "Unknown error"
            ),
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
        !timetableState ||
        !timetableState.schoolId
    ) {

        setTimetableGenerationStatus(
            "Please select a school first.",
            "error"
        );

        return;

    }


    // --------------------------------------------------------
    // PREVENT DUPLICATE GENERATION
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


    if (!confirmed) {

        return;

    }


    try {

        console.log(
            "REGENERATING TIMETABLE..."
        );


        await generateTimetable();


        console.log(
            "TIMETABLE REGENERATION COMPLETE"
        );

    }

    catch (error) {

        console.error(
            "TIMETABLE REGENERATION FAILED:",
            error
        );


        setTimetableGenerationStatus(
            "Regeneration failed: " +
            (
                error.message ||
                "Unknown error"
            ),
            "error"
        );

    }

}


// ============================================================
// PART 8 — PRINT
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
        !timetableContent
    ) {

        alert(
            "Timetable display was not found."
        );

        return;

    }


    if (
        !generatedTimetableEntries ||
        !Array.isArray(
            generatedTimetableEntries
        ) ||
        generatedTimetableEntries.length === 0
    ) {

        alert(
            "There is no generated timetable to print."
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


                .generated-timetable {

                    width: 100%;

                }


                .timetable-stream-block,
                .timetable-stream {

                    margin-bottom: 30px;

                    page-break-inside:
                        avoid;

                }


                .table-responsive,
                .timetable-table-wrapper {

                    width: 100%;

                    overflow: visible;

                }


                table {

                    width: 100%;

                    border-collapse:
                        collapse;

                    margin-bottom: 25px;

                }


                thead {

                    display: table-header-group;

                }


                tr {

                    page-break-inside:
                        avoid;

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
                        11px;

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

                    .timetable-stream-block,
                    .timetable-stream {

                        page-break-inside:
                            avoid;

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
        () => {

            printWindow.print();

        },
        500
    );

}


// ============================================================
// PART 9 — EVENTS
// ============================================================


// ------------------------------------------------------------
// GENERATE
// ------------------------------------------------------------

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


        if (
            !timetableState ||
            !timetableState.schoolId
        ) {

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
                "Generation already running."
            );

            return;

        }


        console.log(
            "🚀 GENERATE TIMETABLE BUTTON CLICKED"
        );


        try {

            await generateTimetable();

        }

        catch (error) {

            console.error(
                "GENERATE TIMETABLE ERROR:",
                error
            );


            setTimetableGenerationStatus(
                "Generation failed: " +
                (
                    error.message ||
                    "Unknown error"
                ),
                "error"
            );

        }

    },
    true
);


// ------------------------------------------------------------
// REGENERATE
// ------------------------------------------------------------

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


// ------------------------------------------------------------
// CLEAR
// ------------------------------------------------------------

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


// ------------------------------------------------------------
// PRINT
// ------------------------------------------------------------

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


        printGeneratedTimetable();

    }
);


// ------------------------------------------------------------
// STREAM FILTER
// ------------------------------------------------------------

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


        await loadGeneratedTimetable();

    }
);


// ------------------------------------------------------------
// DAY FILTER
// ------------------------------------------------------------

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


        await loadGeneratedTimetable();

    }
);


// ------------------------------------------------------------
// VIEW MODE
// ------------------------------------------------------------

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


        await loadGeneratedTimetable();

    }
);


// ============================================================
// PART 10 — INITIALIZATION
// ============================================================

async function initializeTimetableGenerator() {

    console.log(
        "======================================"
    );

    console.log(
        "INITIALIZING TIMETABLE GENERATOR"
    );

    console.log(
        "======================================"
    );


    if (
        !timetableState ||
        !timetableState.schoolId
    ) {

        console.warn(
            "No school selected. Generator initialization skipped."
        );

        return;

    }


    try {

        // ----------------------------------------------------
        // LOAD FILTERS
        // ----------------------------------------------------

        await loadTimetableFilters();


        // ----------------------------------------------------
        // LOAD EXISTING TIMETABLE
        // ----------------------------------------------------

        await loadGeneratedTimetable();


        console.log(
            "======================================"
        );

        console.log(
            "✅ TIMETABLE GENERATOR INITIALIZED"
        );

        console.log(
            "======================================"
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
                "Unknown error"
            ),
            "error"
        );

    }

}


// ============================================================
// GLOBAL API
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
