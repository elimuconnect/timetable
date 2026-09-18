
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
            new Map(),

        requirements:
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
                new Map(),

            requirements:
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


                const parallelGroupSize =
                    Number(
                        requirement.parallel_group_size
                    );


                return {

                    // ------------------------------------------------
                    // IDENTITY
                    // ------------------------------------------------

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


                    // ------------------------------------------------
                    // WEEKLY LESSON REQUIREMENTS
                    // ------------------------------------------------

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


                    // ------------------------------------------------
                    // ROOM REQUIREMENT
                    // ------------------------------------------------

                    requiresRoom:
                        requirement.requires_room === true,

                    // room_type_id is the authoritative
                    // database field.

                    roomTypeId:
                        requirement.room_type_id ||
                        null,

                    // Keep legacy text value too.
                    // Some existing generator/display
                    // logic may still use it.

                    roomType:
                        normalizeRoomType(
                            requirement.room_type
                        ),


                    // ------------------------------------------------
                    // PARALLEL GROUP
                    // ------------------------------------------------

                    parallelGroup:
                        requirement.parallel_group ||
                        null,

                    parallelGroupSize:
                        Number.isFinite(
                            parallelGroupSize
                        ) &&
                        parallelGroupSize > 0
                            ? parallelGroupSize
                            : null,


                    // ------------------------------------------------
                    // DAILY LIMIT
                    // ------------------------------------------------

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

   


    // ========================================================
    // REBUILD LOOKUPS
    // ========================================================

    normalized.lookup =
        buildTimetableLookupMaps(
            normalized
        );
// ========================================================
// NORMALIZE ROOMS
// ========================================================

// ========================================================
// NORMALIZE ROOMS
// ========================================================

normalized.rooms =
    normalized.rooms.map(
        room => {

            return {

                ...room,

                // =================================================
                // AUTHORITATIVE ROOM TYPE ID
                // =================================================

                roomTypeId:
                    room.room_type_id ||
                    room.roomTypeId ||
                    null,

                // =================================================
                // LEGACY ROOM TYPE TEXT
                // =================================================

                roomType:
                    getTimetableRoomType(
                        room
                    ) ||
                    "classroom",

                // =================================================
                // AVAILABILITY
                // =================================================

                available:
                    room.available !== false

            };

        }
    );
    console.log(
        "Generator data normalized successfully."
    );


    console.log(
        "Normalized requirements:",
        normalized.requirements
    );


    return normalized;

}

// ============================================================
// VALIDATE GENERATOR RELATIONSHIPS
// ============================================================

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


            // =================================================
            // ROOM VALIDATION
            // =================================================

            if (
                requirement.requiresRoom
            ) {

                const expectedRoomTypeId =
                    requirement.roomTypeId
                        ? normalizeTimetableId(
                            requirement.roomTypeId
                        )
                        : null;


                const expectedRoomType =
                    normalizeRoomType(
                        requirement.roomType
                    );


                const matchingRooms =
                    data.rooms.filter(
                        room => {

                            if (
                                !room ||
                                room.available === false
                            ) {

                                return false;

                            }


                            // ------------------------------------------------
                            // AUTHORITATIVE ROOM TYPE ID
                            // ------------------------------------------------

                            if (
                                expectedRoomTypeId
                            ) {

                                const actualRoomTypeId =
                                    room.roomTypeId ||
                                    room.room_type_id ||
                                    null;


                                return (
                                    normalizeTimetableId(
                                        actualRoomTypeId
                                    ) ===
                                    expectedRoomTypeId
                                );

                            }


                            // ------------------------------------------------
                            // LEGACY TEXT FALLBACK
                            // ------------------------------------------------

                            if (
                                expectedRoomType
                            ) {

                                return (
                                    getTimetableRoomType(
                                        room
                                    ) ===
                                    expectedRoomType
                                );

                            }


                            // ------------------------------------------------
                            // ROOM REQUIRED BUT NO TYPE
                            // ------------------------------------------------

                            return true;

                        }
                    );


                if (
                    matchingRooms.length === 0
                ) {

                    errors.push({

                        type:
                            "NO_ROOM",

                        requirementId,

                        roomTypeId:
                            expectedRoomTypeId,

                        roomType:
                            expectedRoomType,

                        message:
                            expectedRoomTypeId
                                ? `No available room matching required room type ID "${expectedRoomTypeId}" exists.`
                                : expectedRoomType
                                    ? `No available room of type "${expectedRoomType}" exists.`
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

const basicValidationResult =
    validateTimetableGeneratorData(
        normalizedData
    );


if (
    !basicValidationResult.valid
) {

    throw new Error(

        "Timetable generator data validation failed:\n\n" +

        basicValidationResult.errors.join(
            "\n"
        )

    );

}


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

                // =================================================
                // ROOM TYPE
                // =================================================
                // roomTypeId is the authoritative database value.
                // Keep roomType as the legacy text value as well.
                // =================================================

                roomTypeId:
                    requirement.roomTypeId ||
                    null,

                roomType:
                    normalizeRoomType(
                        requirement.roomType
                    ),

                // =================================================
                // PARALLEL GROUP
                // =================================================

                parallelGroup:
                    requirement.parallelGroup ||
                    null,

                parallelGroupSize:
                    Number(
                        requirement.parallelGroupSize
                    ) > 0
                        ? Number(
                            requirement.parallelGroupSize
                        )
                        : null,

                // =================================================
                // DAILY LIMIT
                // =================================================

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

                roomTypeId:
                    task.roomTypeId,

                roomType:
                    task.roomType,

                parallelGroup:
                    task.parallelGroup,

                parallelGroupSize:
                    task.parallelGroupSize,

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
const warnings = [];

   if (!Array.isArray(tasks)) {

    errors.push(
        "Lesson tasks must be an array."
    );

    return {
        valid: false,
        errors,
        warnings
    };

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

// ============================================================
// GET COMPATIBLE ROOMS
// ============================================================

function getCompatibleRooms(
    task,
    rooms
) {

    // ========================================================
    // VALID ROOM COLLECTION
    // ========================================================

    const availableRooms =
        Array.isArray(rooms)
            ? rooms.filter(
                room =>
                    room &&
                    room.available !== false
            )
            : [];


    // --------------------------------------------------------
    // NO ROOM REQUIRED
    // --------------------------------------------------------

    if (
        !task ||
        task.requiresRoom !== true
    ) {

        return [null];

    }


    // --------------------------------------------------------
    // ROOM REQUIRED BUT NONE AVAILABLE
    // --------------------------------------------------------

    if (
        availableRooms.length === 0
    ) {

        return [];

    }


    // ========================================================
    // AUTHORITATIVE ROOM TYPE ID
    // ========================================================

    const requestedRoomTypeId =
        task.roomTypeId ||
        task.room_type_id ||
        task.requiredRoomTypeId ||
        task.required_room_type_id ||
        null;


    const normalizedRequestedRoomTypeId =
        requestedRoomTypeId
            ? normalizeTimetableId(
                requestedRoomTypeId
            )
            : null;


    // ========================================================
    // LEGACY ROOM TYPE TEXT
    // ========================================================

    const requestedType =
        normalizeRoomType(
            task.roomType
        );


    // ========================================================
    // NO SPECIFIC ROOM TYPE
    // ========================================================

    if (
        !normalizedRequestedRoomTypeId &&
        !requestedType
    ) {

        return shuffleArray(
            availableRooms
        );

    }


    // ========================================================
    // MATCH ROOMS
    // ========================================================

    const matchingRooms =
        availableRooms.filter(
            room => {

                // ------------------------------------------------
                // ROOM TYPE ID
                // ------------------------------------------------
                // This is authoritative when the task has one.
                // ------------------------------------------------

                if (
                    normalizedRequestedRoomTypeId
                ) {

                    const roomTypeId =
                        room.roomTypeId ||
                        room.room_type_id ||
                        room.typeId ||
                        room.type_id ||
                        null;


                    return (
                        normalizeTimetableId(
                            roomTypeId
                        ) ===
                        normalizedRequestedRoomTypeId
                    );

                }


                // ------------------------------------------------
                // LEGACY TEXT FALLBACK
                // ------------------------------------------------

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


    // ========================================================
    // MATCH FOUND
    // ========================================================

    if (
        matchingRooms.length > 0
    ) {

        return shuffleArray(
            matchingRooms
        );

    }


    // ========================================================
    // NO MATCH
    // ========================================================

    console.warn(
        "No compatible room matches requested room type.",
        {

            taskId:
                task.taskId,

            requirementId:
                task.requirementId,

            requestedRoomTypeId:
                normalizedRequestedRoomTypeId,

            requestedType,

            availableRooms:
                availableRooms.map(
                    room => ({

                        roomId:
                            room.id,

                        roomName:
                            getTimetableRoomName(
                                room
                            ),

                        roomTypeId:
                            room.roomTypeId ||
                            room.room_type_id ||
                            null,

                        roomType:
                            getTimetableRoomType(
                                room
                            )

                    })
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


function createOccupancyIndexes(
    data
) {

    // ========================================================
    // NORMALIZE KEY
    // ========================================================

    function normalizeKey(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(
            value
        ).trim();

    }


    // ========================================================
    // PERIOD LOOKUP
    // ========================================================
    //
    // Generated entries store:
    //
    //     period_id
    //
    // Therefore period_id is the canonical period identity.
    //
    // The complete period collection is also stored on the
    // occupancy indexes because teacher consecutive-limit
    // checks need to resolve period IDs back to period objects.
    //
    // ========================================================

    const periods =
        Array.isArray(
            data?.periods
        )
            ? data.periods
            : [];


    const periodLookup =
        new Map();


    periods.forEach(
        period => {

            if (
                !period ||
                period.id === null ||
                period.id === undefined
            ) {

                return;

            }


            periodLookup.set(
                normalizeKey(
                    period.id
                ),
                period
            );

        }
    );


    // ========================================================
    // CREATE EMPTY OCCUPANCY INDEXES
    // ========================================================

    const occupancy = {

        // ====================================================
        // PERIOD DEFINITIONS
        // ====================================================
        //
        // Required by getIndexedPeriod().
        //
        // ====================================================

        periods,

        // ====================================================
        // TEACHER LIMITS
        // ====================================================
        //
        // Required by:
        //
        //     getTeacherMaxConsecutiveLessons()
        //     checkSingleSlotConflict()
        //     checkDoubleLessonConflict()
        //
        // Stores normalized teacher limits by teacher ID.
        //
        // ====================================================

        teacherLimits:
            new Map(),

        // ====================================================
        // PERIOD OCCUPANCY
        // ====================================================

        teacherPeriod:
            new Set(),

        roomPeriod:
            new Set(),

        streamPeriod:
            new Set(),

        studentGroupPeriod:
            new Set(),

         studentGroupPeriodLessons:
        new Map(),

        taskPeriod:
            new Set(),

        teacherSubjectPeriod:
            new Set(),

        // ====================================================
        // DAY INDEXES
        // ====================================================

        teacherDay:
            new Map(),

        streamDay:
            new Map(),

        studentGroupDay:
            new Map(),

        roomDay:
            new Map(),

        requirementDay:
            new Map(),

        dailyRequirementLessons:
            new Map(),

        lessonDay:
            new Map(),

        // ====================================================
        // DAILY REQUIREMENT UNIQUE LESSON KEYS
        // ====================================================
        //
        // One double lesson occupies two periods but counts
        // as one lesson for the requirement/day daily limit.
        //
        // Key format:
        //
        //     requirementId__dayNumber__lessonId
        //
        // ====================================================

        dailyRequirementLessonKeys:
            new Set(),

        // ====================================================
        // TEACHER PERIOD LESSON DETAILS
        // ====================================================

        teacherPeriodLessons:
            new Map()

    };


    // ========================================================
    // BUILD TEACHER LIMIT INDEX
    // ========================================================
    //
    // Teachers were already normalized earlier by
    // normalizeGeneratorData().
    //
    // We therefore support both:
    //
    //     maxLessonsPerDay
    //     max_lessons_per_day
    //
    // and likewise for weekly/consecutive limits.
    //
    // ========================================================

    const teachers =
        Array.isArray(
            data?.teachers
        )
            ? data.teachers
            : [];


    teachers.forEach(
        teacher => {

            if (
                !teacher ||
                teacher.id === null ||
                teacher.id === undefined
            ) {

                return;

            }


            const teacherId =
                normalizeKey(
                    teacher.id
                );


            if (
                !teacherId
            ) {

                return;

            }


            occupancy.teacherLimits.set(
                teacherId,
                {

                    maxLessonsPerDay:
                        Number(
                            teacher.maxLessonsPerDay ??
                            teacher.max_lessons_per_day
                        ) || 0,

                    maxLessonsPerWeek:
                        Number(
                            teacher.maxLessonsPerWeek ??
                            teacher.max_lessons_per_week
                        ) || 0,

                    maxConsecutiveLessons:
                        Number(
                            teacher.maxConsecutiveLessons ??
                            teacher.max_consecutive_lessons
                        ) || 0

                }
            );

        }
    );


    // ========================================================
    // ADD VALUE TO DAY MAP
    // ========================================================

    function addToDayMap(
        map,
        key,
        value
    ) {

        if (
            !map.has(key)
        ) {

            map.set(
                key,
                new Set()
            );

        }


        map.get(key).add(
            value
        );

    }


    // ========================================================
    // GET STUDENT GROUPS
    // ========================================================

    function getStudentGroups(
        task
    ) {

        if (
            !task
        ) {

            return [];

        }


        const possibleFields = [

            task.studentGroupIds,

            task.student_group_ids,

            task.studentGroups,

            task.studentGroupId,

            task.student_group_id,

            task.groupIds,

            task.groupId,

            task.groups

        ];


        for (
            const value of possibleFields
        ) {

            if (
                Array.isArray(value) &&
                value.length > 0
            ) {

                return [
                    ...new Set(
                        value
                            .map(
                                normalizeKey
                            )
                            .filter(
                                Boolean
                            )
                    )
                ];

            }


            if (
                value !== null &&
                value !== undefined &&
                value !== ""
            ) {

                const normalized =
                    normalizeKey(
                        value
                    );


                if (
                    normalized
                ) {

                    return [
                        normalized
                    ];

                }

            }

        }


        // ----------------------------------------------------
        // FALLBACK TO STREAM
        // ----------------------------------------------------

        const streamId =
            normalizeKey(
                task.streamId ??
                task.stream_id ??
                task.stream ??
                task.className ??
                task.class ??
                task.gradeStream
            );


        return streamId
            ? [streamId]
            : [];

    }


    // ========================================================
    // GET GENERATED ENTRIES
    // ========================================================

    const entries =
        Array.isArray(
            data?.generatedTimetableEntries
        )
            ? data.generatedTimetableEntries
            : Array.isArray(
                data?.timetableEntries
            )
                ? data.timetableEntries
                : Array.isArray(
                    data?.entries
                )
                    ? data.entries
                    : [];


    // ========================================================
    // INDEX EXISTING ENTRIES
    // ========================================================

    entries.forEach(
        entry => {

            if (
                !entry ||
                typeof entry !== "object"
            ) {

                return;

            }


            // =================================================
            // CANONICAL PERIOD ID
            // =================================================

            const periodId =
                normalizeKey(
                    entry.period_id ??
                    entry.periodId
                );


            if (
                !periodId
            ) {

                return;

            }


            // =================================================
            // PERIOD OBJECT
            // =================================================

            const period =
                periodLookup.get(
                    periodId
                );


            // =================================================
            // DAY
            // =================================================

            const dayNumber =
                period
                    ? (
                        period.dayNumber ??
                        period.day_number
                    )
                    : (
                        entry.dayNumber ??
                        entry.day_number ??
                        entry.day
                    );


            // =================================================
            // IDENTIFIERS
            // =================================================

            const streamId =
                normalizeKey(
                    entry.stream_id ??
                    entry.streamId ??
                    entry.stream ??
                    entry.className ??
                    entry.class ??
                    entry.gradeStream
                );


            const teacherId =
                normalizeKey(
                    entry.teacher_id ??
                    entry.teacherId ??
                    entry.teacher ??
                    entry.teacherName
                );


            const subjectId =
                normalizeKey(
                    entry.subject_id ??
                    entry.subjectId ??
                    entry.subject ??
                    entry.subjectName
                );


            const roomId =
                normalizeKey(
                    entry.room_id ??
                    entry.roomId ??
                    entry.room ??
                    entry.roomName
                );


            const taskId =
                normalizeKey(
                    entry.taskId ??
                    entry.task_id ??
                    entry.id
                );


            const requirementId =
                normalizeKey(
                    entry.requirementId ??
                    entry.requirement_id
                );


            const lessonId =
                normalizeKey(
                    entry.lessonId ??
                    entry.lesson_id ??
                    taskId
                );


            // =================================================
            // STUDENT GROUPS
            // =================================================

            const studentGroups =
                getStudentGroups(
                    entry
                );


            // =================================================
            // TEACHER OCCUPANCY
            // =================================================

            if (
                teacherId
            ) {

                const teacherKey =
                    `${teacherId}__${periodId}`;


                occupancy.teacherPeriod.add(
                    teacherKey
                );


                // ---------------------------------------------
                // STORE LESSON DETAILS
                // ---------------------------------------------

                if (
                    !occupancy.teacherPeriodLessons.has(
                        teacherKey
                    )
                ) {

                    occupancy.teacherPeriodLessons.set(
                        teacherKey,
                        []
                    );

                }


                occupancy.teacherPeriodLessons
                    .get(
                        teacherKey
                    )
                    .push({

                        taskId:
                            taskId || null,

                        lessonId:
                            lessonId || null,

                        subjectId:
                            subjectId || null,

                        streamId:
                            streamId || null,

                        parallelGroup:
                            entry.parallelGroup ??
                            entry.parallel_group ??
                            null,

                        studentGroupIds:
                            studentGroups

                    });


                // ---------------------------------------------
                // TEACHER + SUBJECT + PERIOD
                // ---------------------------------------------

                if (
                    subjectId
                ) {

                    occupancy.teacherSubjectPeriod.add(
                        `${teacherId}__${subjectId}__${periodId}`
                    );

                }

            }


            // =================================================
            // ROOM OCCUPANCY
            // =================================================

            if (
                roomId &&
                roomId.toLowerCase() !== "none"
            ) {

                occupancy.roomPeriod.add(
                    `${roomId}__${periodId}`
                );

            }


            // =================================================
            // STREAM OCCUPANCY
            // =================================================

            if (
                streamId
            ) {

                occupancy.streamPeriod.add(
                    `${streamId}__${periodId}`
                );

            }


            // =================================================
            // TASK OCCUPANCY
            // =================================================

            if (
                taskId
            ) {

                occupancy.taskPeriod.add(
                    `${taskId}__${periodId}`
                );

            }


           


// =================================================
// STUDENT GROUP / PERIOD LESSON DETAILS
// =================================================
// =================================================
            // STUDENT GROUP OCCUPANCY & LESSON DETAILS
            // =================================================

            studentGroups.forEach(
                studentGroupId => {

                    // 1. Register student group occupancy
                    occupancy.studentGroupPeriod.add(
                        `${studentGroupId}__${periodId}`
                    );

                    // 2. Store student group lesson details
                    const studentGroupKey =
                        `${studentGroupId}__${periodId}`;

                    if (
                        !occupancy.studentGroupPeriodLessons.has(
                            studentGroupKey
                        )
                    ) {

                        occupancy.studentGroupPeriodLessons.set(
                            studentGroupKey,
                            []
                        );

                    }

                    occupancy.studentGroupPeriodLessons
                        .get(
                            studentGroupKey
                        )
                        .push({

                            taskId:
                                taskId ||
                                null,

                            subjectId:
                                subjectId ||
                                null,

                            teacherId:
                                teacherId ||
                                null,

                            parallelGroup:
                                normalizeKey(
                                    entry.parallelGroup ??
                                    entry.parallel_group
                                ) ||
                                null

                        });

                }
            );



            
            // =================================================
            // DAY INDEXES
            // =================================================

            if (
                dayNumber !== null &&
                dayNumber !== undefined
            ) {

                if (
                    teacherId
                ) {

                    addToDayMap(
                        occupancy.teacherDay,
                        teacherId,
                        dayNumber
                    );

                }


                if (
                    streamId
                ) {

                    addToDayMap(
                        occupancy.streamDay,
                        streamId,
                        dayNumber
                    );

                }


                if (
                    studentGroups.length > 0
                ) {

                    studentGroups.forEach(
                        studentGroupId => {

                            addToDayMap(
                                occupancy.studentGroupDay,
                                studentGroupId,
                                dayNumber
                            );

                        }
                    );

                }


                if (
                    roomId &&
                    roomId.toLowerCase() !== "none"
                ) {

                    addToDayMap(
                        occupancy.roomDay,
                        roomId,
                        dayNumber
                    );

                }


                if (
                    requirementId
                ) {

                    addToDayMap(
                        occupancy.requirementDay,
                        requirementId,
                        dayNumber
                    );

                }


                if (
                    lessonId
                ) {

                    addToDayMap(
                        occupancy.lessonDay,
                        lessonId,
                        dayNumber
                    );

                }

            }

        }
    );


    // ========================================================
    // BUILD DAILY REQUIREMENT LESSON COUNTS
    // ========================================================
    //
    // A lesson may occupy more than one period.
    //
    // Therefore we count a lesson ONCE per requirement/day,
    // rather than counting every occupied period.
    //
    // ========================================================

    entries.forEach(
        entry => {

            if (
                !entry ||
                typeof entry !== "object"
            ) {

                return;

            }


            // ------------------------------------------------
            // REQUIREMENT
            // ------------------------------------------------

            const requirementId =
                normalizeKey(
                    entry.requirementId ??
                    entry.requirement_id
                );


            if (
                !requirementId
            ) {

                return;

            }


            // ------------------------------------------------
            // PERIOD
            // ------------------------------------------------

            const periodId =
                normalizeKey(
                    entry.period_id ??
                    entry.periodId
                );


            if (
                !periodId
            ) {

                return;

            }


            // ------------------------------------------------
            // PERIOD OBJECT
            // ------------------------------------------------

            const period =
                periodLookup.get(
                    periodId
                );


            // ------------------------------------------------
            // DAY
            // ------------------------------------------------

            const dayNumber =
                period
                    ? (
                        period.dayNumber ??
                        period.day_number
                    )
                    : (
                        entry.dayNumber ??
                        entry.day_number ??
                        entry.day
                    );


            if (
                dayNumber === null ||
                dayNumber === undefined
            ) {

                return;

            }


            // ------------------------------------------------
            // LESSON ID
            // ------------------------------------------------

            const taskId =
                normalizeKey(
                    entry.taskId ??
                    entry.task_id
                );


            const lessonId =
                normalizeKey(
                    entry.lessonId ??
                    entry.lesson_id ??
                    taskId
                );


            // ------------------------------------------------
            // UNIQUE LESSON ID
            // ------------------------------------------------
            //
            // Double lessons occupy two periods but must count
            // as ONE lesson for daily requirement limits.
            //
            // ------------------------------------------------

            const lessonKey =
                lessonId ||
                taskId ||
                `${requirementId}__${periodId}`;


            const dailyKey =
                `${requirementId}__${dayNumber}`;


            const uniqueLessonKey =
                `${dailyKey}__${lessonKey}`;


            if (
                occupancy.dailyRequirementLessonKeys.has(
                    uniqueLessonKey
                )
            ) {

                return;

            }


            occupancy.dailyRequirementLessonKeys.add(
                uniqueLessonKey
            );


            incrementDailyRequirementLessonCount(
                occupancy,
                requirementId,
                dayNumber,
                1
            );

        }
    );


    // ========================================================
    // RETURN INDEXES
    // ========================================================

    return occupancy;

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

function calculateLongestConsecutivePeriodRun(
    periods
) {

    // ========================================================
    // VALIDATE INPUT
    // ========================================================

    if (
        !Array.isArray(periods) ||
        periods.length === 0
    ) {

        return 0;

    }


    // ========================================================
    // GROUP PERIOD ORDERS BY DAY
    // ========================================================

    const dayGroups =
        new Map();


    periods.forEach(
        period => {

            if (
                !period ||
                typeof period !== "object"
            ) {

                return;

            }


            // ==================================================
            // SUPPORT NORMALIZED AND DATABASE FIELD NAMES
            // ==================================================

            const dayNumber =
                Number(
                    period.dayNumber ??
                    period.day_number
                );


            const periodOrder =
                Number(
                    period.periodOrder ??
                    period.period_order
                );


            if (
                !Number.isFinite(
                    dayNumber
                ) ||
                !Number.isFinite(
                    periodOrder
                )
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


            dayGroups
                .get(
                    dayNumber
                )
                .push(
                    periodOrder
                );

        }
    );


    // ========================================================
    // FIND LONGEST RUN ACROSS ALL DAYS
    // ========================================================

    let longestRun =
        0;


    dayGroups.forEach(
        orders => {

            if (
                !Array.isArray(
                    orders
                ) ||
                orders.length === 0
            ) {

                return;

            }


            // ==================================================
            // REMOVE DUPLICATE PERIOD ORDERS
            // ==================================================

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


            // ==================================================
            // SINGLE PERIOD
            // ==================================================

            let currentRun =
                1;


            let dayLongestRun =
                1;


            // ==================================================
            // CHECK CONSECUTIVE PERIODS
            // ==================================================

            for (
                let i = 1;
                i < uniqueOrders.length;
                i++
            ) {

                const currentOrder =
                    uniqueOrders[i];


                const previousOrder =
                    uniqueOrders[i - 1];


                if (
                    currentOrder ===
                    previousOrder + 1
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


            // ==================================================
            // UPDATE GLOBAL LONGEST RUN
            // ==================================================

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
            task.teacherId ??
            task.teacher_id
        );


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
    // PROJECTED PERIODS
    // ========================================================

    const projectedPeriodMap =
        new Map();


    occupiedPeriods.forEach(
        period => {

            if (
                !period ||
                period.id === null ||
                period.id === undefined
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


    candidatePeriods.forEach(
        period => {

            if (
                !period ||
                period.id === null ||
                period.id === undefined
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
            task?.teacherId ??
            task?.teacher_id
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
// GET STUDENT GROUPS FOR TASK
// ============================================================

function getTaskStudentGroups(
    task
) {

    if (
        !task
    ) {

        return [];

    }


    const possibleGroups =

        task.studentGroupIds ??
        task.student_group_ids ??
        task.studentGroups ??
        task.student_group_ids ??
        task.studentGroupId ??
        task.student_group_id ??
        task.groupIds ??
        task.group_ids ??
        task.groupId ??
        task.group_id ??
        task.groups;


    // ========================================================
    // ARRAY
    // ========================================================

    if (
        Array.isArray(
            possibleGroups
        )
    ) {

        const groups =
            possibleGroups
                .map(
                    group =>
                        normalizeTimetableId(
                            group
                        )
                )
                .filter(
                    Boolean
                );


        if (
            groups.length > 0
        ) {

            return [
                ...new Set(
                    groups
                )
            ];

        }

    }


    // ========================================================
    // SINGLE VALUE
    // ========================================================

    if (
        possibleGroups !== undefined &&
        possibleGroups !== null &&
        String(
            possibleGroups
        ).trim() !== ""
    ) {

        const normalized =
            normalizeTimetableId(
                possibleGroups
            );


        if (
            normalized
        ) {

            return [
                normalized
            ];

        }

    }


    // ========================================================
    // FALLBACK TO STREAM
    // ========================================================

    const streamId =
        normalizeTimetableId(
            task.streamId ??
            task.stream_id
        );


    return streamId
        ? [streamId]
        : [];

}



// ============================================================
// GET TEACHER LESSONS AT PERIOD
// ============================================================

function getTeacherLessonsAtPeriod(
    indexes,
    teacherId,
    periodId
) {

    if (
        !indexes ||
        !teacherId ||
        !periodId
    ) {

        return [];

    }


    const normalizedTeacherId =
        normalizeTimetableId(
            teacherId
        );


    const normalizedPeriodId =
        normalizeTimetableId(
            periodId
        );


    if (
        indexes.teacherPeriodLessons instanceof Map
    ) {

        const key =
            `${normalizedTeacherId}__${normalizedPeriodId}`;


        const existing =
            indexes.teacherPeriodLessons.get(
                key
            );


        if (
            Array.isArray(
                existing
            )
        ) {

            return existing;

        }

    }


    return [];

}



// ============================================================
// GET TASK PARALLEL GROUP
// ============================================================
//
// Parallel lessons may share a teacher only when they belong
// to the same explicit parallel group.
//
// Same subject alone is NOT sufficient.
//
// ============================================================

function getTaskParallelGroup(
    task
) {

    if (
        !task
    ) {

        return "";

    }


    return normalizeTimetableId(
        task.parallelGroup ??
        task.parallel_group
    );

}



// ============================================================
// CHECK WHETHER TWO LESSONS MAY RUN CONCURRENTLY
// ============================================================

function areConcurrentTeacherLessonsAllowed(
    task,
    existingLesson
) {

    if (
        !task ||
        !existingLesson
    ) {

        return false;

    }


    const taskSubjectId =
        normalizeTimetableId(
            task.subjectId ??
            task.subject_id
        );


    const existingSubjectId =
        normalizeTimetableId(
            existingLesson.subjectId ??
            existingLesson.subject_id
        );


    // ========================================================
    // SUBJECT MUST MATCH
    // ========================================================

    if (
        !taskSubjectId ||
        !existingSubjectId ||
        taskSubjectId !== existingSubjectId
    ) {

        return false;

    }


    // ========================================================
    // PARALLEL GROUP
    // ========================================================
    //
    // If an explicit parallel group exists, both lessons must
    // belong to the SAME parallel group.
    //
    // If neither side has a parallel group, same-subject
    // concurrent teaching remains allowed for compatibility
    // with existing shared-teaching data.
    //
    // ========================================================

    const taskParallelGroup =
        getTaskParallelGroup(
            task
        );


    const existingParallelGroup =
        normalizeTimetableId(
            existingLesson.parallelGroup ??
            existingLesson.parallel_group
        );


    if (
        taskParallelGroup ||
        existingParallelGroup
    ) {

        return (
            taskParallelGroup &&
            existingParallelGroup &&
            taskParallelGroup ===
            existingParallelGroup
        );

    }


    return true;

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


    const periodId =
        normalizeTimetableId(
            period.id
        );


    if (
        !periodId
    ) {

        return {

            valid:
                false,

            reason:
                "Period has no valid ID."

        };

    }


    // ========================================================
    // STUDENT GROUP / STREAM
    // ========================================================

    const studentGroups =
        getTaskStudentGroups(
            task
        );


    for (
        const studentGroupId of studentGroups
    ) {

        if (
            !studentGroupId
        ) {

            continue;

        }


        const studentGroupKey =
            `${studentGroupId}__${periodId}`;


        if (
            !indexes.studentGroupPeriod ||
            !indexes.studentGroupPeriod.has(
                studentGroupKey
            )
        ) {

            continue;

        }


        // ====================================================
        // CHECK WHETHER THIS IS VALID PARALLEL TEACHING
        // ====================================================

        const existingLessons =
            indexes.studentGroupPeriodLessons
                instanceof Map
                ? (
                    indexes.studentGroupPeriodLessons.get(
                        studentGroupKey
                    ) || []
                )
                : [];


        const taskSubjectId =
            normalizeTimetableId(
                task.subjectId ??
                task.subject_id
            );


        const taskTeacherId =
            normalizeTimetableId(
                task.teacherId ??
                task.teacher_id
            );


        const taskParallelGroup =
            normalizeTimetableId(
                task.parallelGroup ??
                task.parallel_group
            );


        const parallelTeachingAllowed =
            existingLessons.length > 0 &&
            existingLessons.every(
                existingLesson => {

                    const existingSubjectId =
                        normalizeTimetableId(
                            existingLesson.subjectId
                        );


                    const existingTeacherId =
                        normalizeTimetableId(
                            existingLesson.teacherId
                        );


                    const existingParallelGroup =
                        normalizeTimetableId(
                            existingLesson.parallelGroup
                        );


                    // Different subject required

                    if (
                        !taskSubjectId ||
                        !existingSubjectId ||
                        taskSubjectId ===
                        existingSubjectId
                    ) {

                        return false;

                    }


                    // Different teacher required

                    if (
                        !taskTeacherId ||
                        !existingTeacherId ||
                        taskTeacherId ===
                        existingTeacherId
                    ) {

                        return false;

                    }


                    // Explicit parallel group must match

                    if (
                        taskParallelGroup ||
                        existingParallelGroup
                    ) {

                        return (
                            taskParallelGroup &&
                            existingParallelGroup &&
                            taskParallelGroup ===
                            existingParallelGroup
                        );

                    }


                    return false;

                }
            );


        if (
            !parallelTeachingAllowed
        ) {

            return {

                valid:
                    false,

                reason:
                    "Student group is already occupied by a conflicting lesson in this period."

            };

        }

    }


    // ========================================================
    // TEACHER
    // ========================================================

    const teacherId =
        normalizeTimetableId(
            task.teacherId ??
            task.teacher_id
        );


    if (
        teacherId
    ) {

        const teacherKey =
            `${teacherId}__${periodId}`;


        const existingTeacherLessons =
            indexes.teacherPeriod &&
            indexes.teacherPeriod.has(
                teacherKey
            )
                ? getTeacherLessonsAtPeriod(
                    indexes,
                    teacherId,
                    periodId
                )
                : [];


        // ====================================================
        // DETERMINE WHETHER THIS IS A SHARED TEACHER SESSION
        // ====================================================
        //
        // Same teacher + same subject + same period across
        // streams is one teacher session, not two.
        //
        // If the existing lessons are all compatible
        // concurrent lessons, the candidate does NOT add
        // another teacher session.
        //
        // ====================================================

        const teacherConcurrentSession =
            existingTeacherLessons.length > 0 &&
            existingTeacherLessons.every(
                existingLesson =>
                    areConcurrentTeacherLessonsAllowed(
                        task,
                        existingLesson
                    )
            );


        // ----------------------------------------------------
        // TEACHER PERIOD CONFLICT
        // ----------------------------------------------------

        if (
            existingTeacherLessons.length > 0 &&
            !teacherConcurrentSession
        ) {

            return {

                valid:
                    false,

                reason:
                    "Teacher is already teaching a conflicting lesson in this period."

            };

        }


        // ====================================================
        // TEACHER LIMITS
        // ====================================================

        const teacherLimits =
            indexes.teacherLimits instanceof Map
                ? indexes.teacherLimits.get(
                    teacherId
                )
                : null;


        // ----------------------------------------------------
        // IMPORTANT:
        //
        // A shared/concurrent lesson does NOT create another
        // teacher session.
        //
        // Therefore:
        //
        //     concurrent session -> increment = 0
        //     new teacher session -> increment = 1
        //
        // ----------------------------------------------------

        const projectedTeacherSessionIncrement =
            teacherConcurrentSession
                ? 0
                : 1;


        // ====================================================
        // TEACHER DAILY LIMIT
        // ====================================================

        const maximumDailyLessons =
            Number(
                teacherLimits?.maxLessonsPerDay
            ) || 0;


        if (
            maximumDailyLessons > 0 &&
            projectedTeacherSessionIncrement > 0
        ) {

            const dayNumber =
                Number(
                    period.dayNumber ??
                    period.day_number
                );


            if (
                Number.isFinite(
                    dayNumber
                )
            ) {

                const currentDailyLessons =
                    getTeacherDailyLessonCountFromPeriods(
                        indexes,
                        teacherId,
                        dayNumber,
                        indexes.periods
                    );


                if (
                    currentDailyLessons +
                    projectedTeacherSessionIncrement >
                    maximumDailyLessons
                ) {

                    return {

                        valid:
                            false,

                        reason:
                            `Teacher would exceed the maximum of ${maximumDailyLessons} lessons per day.`

                    };

                }

            }

        }


        // ====================================================
        // TEACHER WEEKLY LIMIT
        // ====================================================

        const maximumWeeklyLessons =
            Number(
                teacherLimits?.maxLessonsPerWeek
            ) || 0;


        if (
            maximumWeeklyLessons > 0 &&
            projectedTeacherSessionIncrement > 0
        ) {

            const currentWeeklyLessons =
                getTeacherWeeklyLessonCount(
                    indexes,
                    teacherId
                );


            if (
                currentWeeklyLessons +
                projectedTeacherSessionIncrement >
                maximumWeeklyLessons
            ) {

                return {

                    valid:
                        false,

                    reason:
                        `Teacher would exceed the maximum of ${maximumWeeklyLessons} lessons per week.`

                };

            }

        }


        // ====================================================
        // TEACHER CONSECUTIVE LIMIT
        // ====================================================
        //
        // A shared concurrent lesson does not create another
        // teacher session, so it cannot increase a consecutive
        // session count.
        //
        // ====================================================

        if (
            !teacherConcurrentSession &&
            wouldExceedTeacherConsecutiveLimit(
                task,
                [
                    period
                ],
                indexes
            )
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

        const roomId =
            normalizeTimetableId(
                room.id
            );


        const roomKey =
            `${roomId}__${periodId}`;


        if (
            indexes.roomPeriod &&
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
            task.requirementId ??
            task.requirement_id
        );


    const maxPerDay =
        Number(
            task.maxLessonsPerDay ??
            task.max_lessons_per_day
        ) || 0;


    const dayNumber =
        Number(
            period.dayNumber ??
            period.day_number
        );


    if (
        requirementId &&
        maxPerDay > 0 &&
        Number.isFinite(
            dayNumber
        )
    ) {

        const currentCount =
            getDailyRequirementLessonCount(
                indexes,
                requirementId,
                dayNumber
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
// RESERVE SLOT
// ============================================================
//
// Reserves ONE timetable period.
//
// IMPORTANT:
//
// A double lesson calls reserveSlot() twice.
//
// Therefore daily requirement lesson counting is protected by
// a unique requirement/day/lesson key so the two periods of
// one double lesson count as ONE lesson.
//
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

        console.warn(
            "reserveSlot: Missing task, period or indexes."
        );

        return false;

    }


    const streamId =
        normalizeTimetableId(
            task.streamId ??
            task.stream_id
        );


    const periodId =
        normalizeTimetableId(
            period.id
        );


    if (
        !periodId
    ) {

        return false;

    }


    const requirementId =
        normalizeTimetableId(
            task.requirementId ??
            task.requirement_id
        );


    // ========================================================
    // TASK / PERIOD
    // ========================================================
    //
    // Keep a direct record of every task occupying a period.
    //
    // releaseReservedSlot() uses this index when determining
    // whether a task still occupies another period on the same
    // day, especially for double lessons.
    //
    // ========================================================

    const taskId =
        normalizeTimetableId(
            task.taskId ??
            task.task_id ??
            task.id
        );


    if (
        taskId
    ) {

        if (
            !(indexes.taskPeriod instanceof Set)
        ) {

            indexes.taskPeriod =
                new Set();

        }


        indexes.taskPeriod.add(
            `${taskId}__${periodId}`
        );

    }


    // ========================================================
    // STREAM / PERIOD
    // ========================================================

    if (
        streamId &&
        indexes.streamPeriod
    ) {

        indexes.streamPeriod.add(
            `${streamId}__${periodId}`
        );

    }


    // ========================================================
    // STUDENT GROUP / PERIOD
    // ========================================================

    const studentGroups =
        getTaskStudentGroups(
            task
        );


    if (
        indexes.studentGroupPeriod
    ) {

        for (
            const studentGroupId of studentGroups
        ) {

            if (
                !studentGroupId
            ) {

                continue;

            }


            const studentGroupKey =
                `${studentGroupId}__${periodId}`;


            indexes.studentGroupPeriod.add(
                studentGroupKey
            );


            // ========================================================
            // STUDENT GROUP / PERIOD LESSON DETAILS
            // ========================================================

            if (
                !(
                    indexes.studentGroupPeriodLessons
                    instanceof Map
                )
            ) {

                indexes.studentGroupPeriodLessons =
                    new Map();

            }


            if (
                !indexes.studentGroupPeriodLessons.has(
                    studentGroupKey
                )
            ) {

                indexes.studentGroupPeriodLessons.set(
                    studentGroupKey,
                    []
                );

            }


            indexes.studentGroupPeriodLessons
                .get(
                    studentGroupKey
                )
                .push({

                    taskId:
                        task.taskId ??
                        task.task_id ??
                        task.id ??
                        null,

                    subjectId:
                        task.subjectId ??
                        task.subject_id ??
                        null,

                    teacherId:
                        task.teacherId ??
                        task.teacher_id ??
                        null,

                    parallelGroup:
                        task.parallelGroup ??
                        task.parallel_group ??
                        null

                });

        }

    }


    // ========================================================
    // TEACHER / PERIOD
    // ========================================================

    const teacherId =
        normalizeTimetableId(
            task.teacherId ??
            task.teacher_id
        );


    if (
        teacherId
    ) {

        if (
            !indexes.teacherPeriod
        ) {

            indexes.teacherPeriod =
                new Set();

        }


        indexes.teacherPeriod.add(
            `${teacherId}__${periodId}`
        );


        // ----------------------------------------------------
        // DETAILED TEACHER LESSON INDEX
        // ----------------------------------------------------

        if (
            !(
                indexes.teacherPeriodLessons
                instanceof Map
            )
        ) {

            indexes.teacherPeriodLessons =
                new Map();

        }


        const teacherKey =
            `${teacherId}__${periodId}`;


        if (
            !indexes.teacherPeriodLessons.has(
                teacherKey
            )
        ) {

            indexes.teacherPeriodLessons.set(
                teacherKey,
                []
            );

        }


        indexes.teacherPeriodLessons
            .get(
                teacherKey
            )
            .push({

                taskId:
                    task.taskId ??
                    task.task_id ??
                    task.id ??
                    null,

                lessonId:
                    task.lessonId ??
                    task.lesson_id ??
                    null,

                subjectId:
                    task.subjectId ??
                    task.subject_id ??
                    null,

                streamId:
                    task.streamId ??
                    task.stream_id ??
                    null,

                parallelGroup:
                    task.parallelGroup ??
                    task.parallel_group ??
                    null,

                studentGroupIds:
                    [
                        ...studentGroups
                    ]

            });

    }


    // ========================================================
    // ROOM / PERIOD
    // ========================================================

    if (
        room &&
        room.id
    ) {

        if (
            !indexes.roomPeriod
        ) {

            indexes.roomPeriod =
                new Set();

        }


        const roomId =
            normalizeTimetableId(
                room.id
            );


        if (
            roomId
        ) {

            indexes.roomPeriod.add(
                `${roomId}__${periodId}`
            );

        }

    }


    // ========================================================
    // DAY INDEXES
    // ========================================================

    const dayNumber =
        Number(
            period.dayNumber ??
            period.day_number
        );


    if (
        Number.isFinite(
            dayNumber
        )
    ) {

        // ----------------------------------------------------
        // TEACHER DAY
        // ----------------------------------------------------

        if (
            teacherId &&
            indexes.teacherDay instanceof Map
        ) {

            if (
                !indexes.teacherDay.has(
                    teacherId
                )
            ) {

                indexes.teacherDay.set(
                    teacherId,
                    new Set()
                );

            }


            indexes.teacherDay
                .get(
                    teacherId
                )
                .add(
                    dayNumber
                );

        }


        // ----------------------------------------------------
        // STREAM DAY
        // ----------------------------------------------------

        if (
            streamId &&
            indexes.streamDay instanceof Map
        ) {

            if (
                !indexes.streamDay.has(
                    streamId
                )
            ) {

                indexes.streamDay.set(
                    streamId,
                    new Set()
                );

            }


            indexes.streamDay
                .get(
                    streamId
                )
                .add(
                    dayNumber
                );

        }


        // ----------------------------------------------------
        // STUDENT GROUP DAY
        // ----------------------------------------------------

        if (
            indexes.studentGroupDay instanceof Map
        ) {

            studentGroups.forEach(
                studentGroupId => {

                    if (
                        !indexes.studentGroupDay.has(
                            studentGroupId
                        )
                    ) {

                        indexes.studentGroupDay.set(
                            studentGroupId,
                            new Set()
                        );

                    }


                    indexes.studentGroupDay
                        .get(
                            studentGroupId
                        )
                        .add(
                            dayNumber
                        );

                }
            );

        }


        // ----------------------------------------------------
        // ROOM DAY
        // ----------------------------------------------------

        if (
            room &&
            room.id &&
            indexes.roomDay instanceof Map
        ) {

            const roomId =
                normalizeTimetableId(
                    room.id
                );


            if (
                roomId
            ) {

                if (
                    !indexes.roomDay.has(
                        roomId
                    )
                ) {

                    indexes.roomDay.set(
                        roomId,
                        new Set()
                    );

                }


                indexes.roomDay
                    .get(
                        roomId
                    )
                    .add(
                        dayNumber
                    );

            }

        }


        // ----------------------------------------------------
        // REQUIREMENT DAY
        // ----------------------------------------------------

        if (
            requirementId &&
            indexes.requirementDay instanceof Map
        ) {

            if (
                !indexes.requirementDay.has(
                    requirementId
                )
            ) {

                indexes.requirementDay.set(
                    requirementId,
                    new Set()
                );

            }


            indexes.requirementDay
                .get(
                    requirementId
                )
                .add(
                    dayNumber
                );

        }

    }


    // ========================================================
    // DAILY REQUIREMENT LESSON COUNT
    // ========================================================
    //
    // CRITICAL:
    //
    // A double lesson occupies two periods but is ONE lesson.
    //
    // Use:
    //
    //     requirement + day + lesson/task
    //
    // as the unique key.
    //
    // ========================================================

    if (
        requirementId &&
        Number.isFinite(
            dayNumber
        )
    ) {

        if (
            !(
                indexes.dailyRequirementLessonKeys
                instanceof Set
            )
        ) {

            indexes.dailyRequirementLessonKeys =
                new Set();

        }


        const lessonId =
            normalizeTimetableId(
                task.lessonId ??
                task.lesson_id ??
                task.taskId ??
                task.task_id ??
                task.id
            );


        const lessonKey =
            lessonId ||
            `${requirementId}__${periodId}`;


        const uniqueDailyLessonKey =
            `${requirementId}__${dayNumber}__${lessonKey}`;


        if (
            !indexes.dailyRequirementLessonKeys.has(
                uniqueDailyLessonKey
            )
        ) {

            indexes.dailyRequirementLessonKeys.add(
                uniqueDailyLessonKey
            );


            incrementDailyRequirementLessonCount(
                indexes,
                requirementId,
                dayNumber,
                1
            );

        }

    }


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


    const studentGroups =
        getTaskStudentGroups(
            task
        );


    return {

        school_id:
            timetableState.schoolId,

        period_id:
            period.id,

        stream_id:
            task.streamId ??
            task.stream_id ??
            null,

        subject_id:
            task.subjectId ??
            task.subject_id ??
            null,

        teacher_id:
            task.teacherId ??
            task.teacher_id ??
            null,

        room_id:
            room?.id ||
            null,

        task_id:
            task.taskId ??
            task.task_id ??
            task.id ??
            null,

        requirement_id:
            task.requirementId ??
            task.requirement_id ??
            null,

        lesson_id:
            task.lessonId ??
            task.lesson_id ??
            task.taskId ??
            task.task_id ??
            task.id ??
            null,

        // ====================================================
        // PARALLEL GROUP
        // ====================================================
        //
        // Required by Stage 6G stream-conflict auditing.
        //
        // Without this field, valid parallel teaching
        // cannot be distinguished from a true stream conflict.
        //
        parallel_group:
            task.parallelGroup ??
            task.parallel_group ??
            null,

        student_group_ids:
            [
                ...studentGroups
            ]

    };

}



// ============================================================
// STAGE 4 — GET CONSECUTIVE TEACHING PERIOD PAIRS
// ============================================================

function getConsecutiveTeachingPeriodPairs(
    periods
) {

    if (
        !Array.isArray(
            periods
        )
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


    console.log(
        "Consecutive teaching period pairs:",
        pairs.length
    );


    return pairs;

}



// ============================================================
// CHECK DOUBLE LESSON CONFLICT
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
    // BOTH PERIODS MUST BE ON SAME DAY
    // ========================================================

    const firstDay =
        Number(
            firstPeriod.dayNumber ??
            firstPeriod.day_number
        );


    const secondDay =
        Number(
            secondPeriod.dayNumber ??
            secondPeriod.day_number
        );


    if (
        Number.isFinite(firstDay) &&
        Number.isFinite(secondDay) &&
        firstDay !== secondDay
    ) {

        return {

            valid:
                false,

            reason:
                "Double lesson periods must be on the same day."

        };

    }


    // ========================================================
    // FIRST PERIOD
    // ========================================================
    //
    // checkSingleSlotConflict() handles:
    //
    // - student group
    // - parallel teaching
    // - teacher conflict
    // - teacher daily limit
    // - teacher weekly limit
    // - teacher consecutive limit
    // - room
    // - requirement daily limit
    //
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
    // IDENTIFIERS
    // ========================================================

    const secondPeriodId =
        normalizeTimetableId(
            secondPeriod.id
        );


    const teacherId =
        normalizeTimetableId(
            task.teacherId ??
            task.teacher_id
        );


    // ========================================================
    // TEACHER LIMITS
    // ========================================================
    //
    // A double lesson occupies TWO teaching periods.
    //
    // ========================================================

    if (
        teacherId
    ) {

        const teacherLimits =
            indexes.teacherLimits instanceof Map
                ? indexes.teacherLimits.get(
                    teacherId
                )
                : null;


        // ====================================================
        // DAILY LIMIT
        // ====================================================

        const maximumDailyLessons =
            Number(
                teacherLimits?.maxLessonsPerDay
            ) || 0;


        if (
            maximumDailyLessons > 0 &&
            Number.isFinite(firstDay)
        ) {

            const currentDailyLessons =
                getTeacherDailyLessonCountFromPeriods(
                    indexes,
                    teacherId,
                    firstDay,
                    indexes.periods
                );


            const projectedDailyLessons =
                currentDailyLessons + 2;


            if (
                projectedDailyLessons >
                maximumDailyLessons
            ) {

                return {

                    valid:
                        false,

                    reason:
                        `Double lesson would exceed the teacher maximum of ${maximumDailyLessons} lessons per day.`

                };

            }

        }


        // ====================================================
        // WEEKLY LIMIT
        // ====================================================

        const maximumWeeklyLessons =
            Number(
                teacherLimits?.maxLessonsPerWeek
            ) || 0;


        if (
            maximumWeeklyLessons > 0
        ) {

            const currentWeeklyLessons =
                getTeacherWeeklyLessonCount(
                    indexes,
                    teacherId
                );


            const projectedWeeklyLessons =
                currentWeeklyLessons + 2;


            if (
                projectedWeeklyLessons >
                maximumWeeklyLessons
            ) {

                return {

                    valid:
                        false,

                    reason:
                        `Double lesson would exceed the teacher maximum of ${maximumWeeklyLessons} lessons per week.`

                };

            }

        }

    }


    // ========================================================
    // STUDENT GROUP / SECOND PERIOD
    // ========================================================
    //
    // IMPORTANT:
    //
    // A student group may have another lesson in this period
    // ONLY when this is legitimate parallel teaching:
    //
    // - different subject
    // - different teacher
    // - same parallel group
    //
    // Otherwise the placement is rejected.
    //
    // ========================================================

    const studentGroups =
        getTaskStudentGroups(
            task
        );


    for (
        const studentGroupId of studentGroups
    ) {

        if (
            !studentGroupId
        ) {

            continue;

        }


        const normalizedStudentGroupId =
            normalizeTimetableId(
                studentGroupId
            );


        const studentGroupKey =
            `${normalizedStudentGroupId}__${secondPeriodId}`;


        if (
            indexes.studentGroupPeriod &&
            indexes.studentGroupPeriod.has(
                studentGroupKey
            )
        ) {

            const existingLessons =
                indexes.studentGroupPeriodLessons instanceof Map
                    ? (
                        indexes.studentGroupPeriodLessons.get(
                            studentGroupKey
                        ) || []
                    )
                    : [];


            const taskSubjectId =
                normalizeTimetableId(
                    task.subjectId ??
                    task.subject_id
                );


            const taskTeacherId =
                normalizeTimetableId(
                    task.teacherId ??
                    task.teacher_id
                );


            const taskParallelGroup =
                getTaskParallelGroup(
                    task
                );


            const parallelTeachingAllowed =
                existingLessons.length > 0 &&
                existingLessons.every(
                    existingLesson => {

                        if (
                            !existingLesson
                        ) {

                            return false;

                        }


                        const existingSubjectId =
                            normalizeTimetableId(
                                existingLesson.subjectId ??
                                existingLesson.subject_id
                            );


                        const existingTeacherId =
                            normalizeTimetableId(
                                existingLesson.teacherId ??
                                existingLesson.teacher_id
                            );


                        const existingParallelGroup =
                            normalizeTimetableId(
                                existingLesson.parallelGroup ??
                                existingLesson.parallel_group
                            );


                        // --------------------------------------------
                        // DIFFERENT SUBJECT REQUIRED
                        // --------------------------------------------

                        if (
                            !taskSubjectId ||
                            !existingSubjectId ||
                            taskSubjectId ===
                            existingSubjectId
                        ) {

                            return false;

                        }


                        // --------------------------------------------
                        // DIFFERENT TEACHER REQUIRED
                        // --------------------------------------------

                        if (
                            !taskTeacherId ||
                            !existingTeacherId ||
                            taskTeacherId ===
                            existingTeacherId
                        ) {

                            return false;

                        }


                        // --------------------------------------------
                        // SAME PARALLEL GROUP REQUIRED
                        // --------------------------------------------

                        if (
                            taskParallelGroup ||
                            existingParallelGroup
                        ) {

                            return (
                                taskParallelGroup &&
                                existingParallelGroup &&
                                taskParallelGroup ===
                                existingParallelGroup
                            );

                        }


                        // --------------------------------------------
                        // No parallel group means this is NOT
                        // parallel teaching.
                        // --------------------------------------------

                        return false;

                    }
                );


            if (
                !parallelTeachingAllowed
            ) {

                return {

                    valid:
                        false,

                    reason:
                        "Student group is already occupied by a conflicting lesson in the second period."

                };

            }

        }

    }


    // ========================================================
    // TEACHER / SECOND PERIOD
    // ========================================================

    if (
        teacherId
    ) {

        const teacherKey =
            `${teacherId}__${secondPeriodId}`;


        if (
            indexes.teacherPeriod &&
            indexes.teacherPeriod.has(
                teacherKey
            )
        ) {

            const existingTeacherLessons =
                getTeacherLessonsAtPeriod(
                    indexes,
                    teacherId,
                    secondPeriodId
                );


            const concurrentAllowed =
                existingTeacherLessons.length > 0 &&
                existingTeacherLessons.every(
                    existingLesson =>
                        areConcurrentTeacherLessonsAllowed(
                            task,
                            existingLesson
                        )
                );


            if (
                !concurrentAllowed
            ) {

                return {

                    valid:
                        false,

                    reason:
                        "Teacher is already teaching a conflicting lesson in the second period."

                };

            }

        }

    }


    // ========================================================
    // TEACHER CONSECUTIVE LIMIT
    // ========================================================

    if (
        teacherId
    ) {

        if (
            wouldExceedTeacherConsecutiveLimit(
                task,
                [
                    firstPeriod,
                    secondPeriod
                ],
                indexes
            )
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
    // ROOM / SECOND PERIOD
    // ========================================================

    if (
        room &&
        room.id
    ) {

        const roomId =
            normalizeTimetableId(
                room.id
            );


        const roomKey =
            `${roomId}__${secondPeriodId}`;


        if (
            indexes.roomPeriod &&
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
    // DAILY REQUIREMENT LIMIT
    // ========================================================
    //
    // A double lesson counts as ONE lesson for the
    // requirement daily limit.
    //
    // ========================================================

    const requirementId =
        normalizeTimetableId(
            task.requirementId ??
            task.requirement_id
        );


    const maxPerDay =
        Number(
            task.maxLessonsPerDay ??
            task.max_lessons_per_day
        ) || 0;


    if (
        requirementId &&
        maxPerDay > 0 &&
        Number.isFinite(firstDay)
    ) {

        const currentCount =
            getDailyRequirementLessonCount(
                indexes,
                requirementId,
                firstDay
            );


        if (
            currentCount + 1 >
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
    // ROOM REQUIREMENT
    // ========================================================

    const requiresRoom =
        Boolean(
            task.requiresRoom
        );


    const compatibleRooms =
        getCompatibleRooms(
            task,
            rooms
        );


    // --------------------------------------------------------
    // If a room is required, at least one compatible room
    // must exist.
    // --------------------------------------------------------

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
                "No compatible room is available for this double lesson."

        };

    }


    // --------------------------------------------------------
    // If no room is required, use a null room.
    // --------------------------------------------------------

    const candidateRooms =
        requiresRoom
            ? compatibleRooms
            : [null];


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


        // ====================================================
        // TRY EACH ROOM
        // ====================================================

        const shuffledRooms =
            shuffleArray(
                candidateRooms
            );


        for (
            const room of shuffledRooms
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
                !conflict ||
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

                    requirementId:
                        task.requirementId,

                    streamId:
                        task.streamId,

                    subjectId:
                        task.subjectId,

                    firstPeriod:
                        pair.first.id,

                    secondPeriod:
                        pair.second.id,

                    roomId:
                        room?.id ||
                        null,

                    roomTypeId:
                        task.roomTypeId ||
                        null,

                    parallelGroup:
                        task.parallelGroup ||
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

            requirementId:
                task.requirementId,

            streamId:
                task.streamId,

            subjectId:
                task.subjectId,

            teacherId:
                task.teacherId,

            requiresRoom:
                task.requiresRoom,

            roomTypeId:
                task.roomTypeId ||
                null,

            parallelGroup:
                task.parallelGroup ||
                null

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
    task.roomTypeId ||
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
    task.roomTypeId ||
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

            requirementId:
                task.requirementId,

            type:
                task.taskType,

            duration:
                task.duration,

            roomRequired:
                task.requiresRoom,

            roomTypeId:
                task.roomTypeId,

            roomType:
                task.roomType,

            parallelGroup:
                task.parallelGroup,

            parallelGroupSize:
                task.parallelGroupSize,

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

            if (
                !task ||
                typeof task !== "object"
            ) {

                return;

            }


            task.placed =
                false;

            task.periodIds =
                [];

            task.roomId =
                null;

            // ------------------------------------------------
            // Ensure placement metadata does not retain
            // stale values from an earlier generation pass.
            // ------------------------------------------------

            task.periodId =
                null;

            task.firstPeriodId =
                null;

            task.secondPeriodId =
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
//
// IMPORTANT:
//
// This counts UNIQUE TEACHER SESSIONS.
//
// A teacher teaching the SAME subject to multiple streams
// in the SAME period counts as ONE teaching session.
//
// Session identity:
//
//     teacher + period + subject
//
// ============================================================

function getTeacherDailyLessonCount(
    teacherId,
    dayNumber,
    periods
) {

    const normalizedTeacherId =
        normalizeTimetableId(
            teacherId
        );


    if (
        !normalizedTeacherId ||
        !Array.isArray(periods)
    ) {

        return 0;

    }


    // ========================================================
    // USE CURRENT GENERATOR OCCUPANCY WHEN AVAILABLE
    // ========================================================

    const indexes =
        timetableState?.occupancy;


    if (
        indexes
    ) {

        return getTeacherDailyLessonCountFromPeriods(
            indexes,
            normalizedTeacherId,
            dayNumber,
            periods
        );

    }


    return 0;

}


// ============================================================
// GET TEACHER DAILY LESSON COUNT FROM PERIODS
// ============================================================
//
// Uses the actual occupancy indexes supplied by the generator.
//
// Counts UNIQUE teacher sessions:
//
//     teacher + period + subject
//
// Therefore:
//
//     Teacher + Biology + P1 + 10E
//     Teacher + Biology + P1 + 10M
//
// counts as:
//
//     ONE teacher lesson.
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


    if (
        !normalizedTeacherId
    ) {

        return 0;

    }


    // ========================================================
    // BUILD PERIOD LOOKUP
    // ========================================================

    const periodMap =
        new Map();


    periods.forEach(
        period => {

            if (
                !period ||
                period.id === null ||
                period.id === undefined
            ) {

                return;

            }


            const periodId =
                normalizeTimetableId(
                    period.id
                );


            if (
                !periodId
            ) {

                return;

            }


            periodMap.set(
                periodId,
                period
            );

        }
    );


    // ========================================================
    // UNIQUE TEACHER SESSION SET
    // ========================================================
    //
    // Identity:
    //
    //     teacher + period + subject
    //
    // Therefore:
    //
    // Teacher A + Biology + P1 + Stream 1
    // Teacher A + Biology + P1 + Stream 2
    //
    // = ONE teacher session.
    //
    // ========================================================

    const uniqueSessions =
        new Set();


    // ========================================================
    // PREFERRED SOURCE:
    // DETAILED TEACHER LESSON INDEX
    // ========================================================

    if (
        indexes.teacherPeriodLessons instanceof Map
    ) {

        indexes.teacherPeriodLessons.forEach(
            (
                lessons,
                teacherPeriodKey
            ) => {

                if (
                    !Array.isArray(lessons)
                ) {

                    return;

                }


                const prefix =
                    `${normalizedTeacherId}__`;


                if (
                    !teacherPeriodKey.startsWith(
                        prefix
                    )
                ) {

                    return;

                }


                const periodId =
                    teacherPeriodKey.substring(
                        prefix.length
                    );


                const period =
                    periodMap.get(
                        periodId
                    );


                if (
                    !period
                ) {

                    return;

                }


                const periodDay =
                    Number(
                        period.dayNumber ??
                        period.day_number
                    );


                if (
                    periodDay !==
                    Number(dayNumber)
                ) {

                    return;

                }


                // ------------------------------------------------
                // Each unique subject in this teacher-period
                // represents one teaching session.
                // ------------------------------------------------

                lessons.forEach(
                    lesson => {

                        if (
                            !lesson
                        ) {

                            return;

                        }


                        const subjectId =
                            normalizeTimetableId(
                                lesson.subjectId ??
                                lesson.subject_id
                            );


                        const sessionSubject =
                            subjectId ||
                            normalizeTimetableId(
                                lesson.lessonId ??
                                lesson.taskId
                            );


                        if (
                            !sessionSubject
                        ) {

                            return;

                        }


                        uniqueSessions.add(
                            `${periodId}__${sessionSubject}`
                        );

                    }
                );

            }
        );

    }


    // ========================================================
    // FALLBACK
    // ========================================================

    if (
        uniqueSessions.size === 0 &&
        indexes.teacherPeriod instanceof Set
    ) {

        indexes.teacherPeriod.forEach(
            key => {

                const prefix =
                    `${normalizedTeacherId}__`;


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
                    !period
                ) {

                    return;

                }


                const periodDay =
                    Number(
                        period.dayNumber ??
                        period.day_number
                    );


                if (
                    periodDay !==
                    Number(dayNumber)
                ) {

                    return;

                }


                uniqueSessions.add(
                    `${periodId}__NO_SUBJECT`
                );

            }
        );

    }


    return uniqueSessions.size;

}

// ============================================================
// GET TEACHER WEEKLY LESSON COUNT
// ============================================================
//
// Counts UNIQUE teacher teaching sessions across the week.
//
// Same teacher + same subject + same period across multiple
// streams = ONE teaching session.
//
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


    if (
        !normalizedTeacherId
    ) {

        return 0;

    }


    const uniqueSessions =
        new Set();


    // ========================================================
    // PREFERRED SOURCE:
    // DETAILED TEACHER LESSON INDEX
    // ========================================================

    if (
        indexes.teacherPeriodLessons instanceof Map
    ) {

        indexes.teacherPeriodLessons.forEach(
            (
                lessons,
                teacherPeriodKey
            ) => {

                if (
                    !Array.isArray(lessons)
                ) {

                    return;

                }


                const prefix =
                    `${normalizedTeacherId}__`;


                if (
                    !teacherPeriodKey.startsWith(
                        prefix
                    )
                ) {

                    return;

                }


                const periodId =
                    teacherPeriodKey.substring(
                        prefix.length
                    );


                lessons.forEach(
                    lesson => {

                        if (
                            !lesson
                        ) {

                            return;

                        }


                        const subjectId =
                            normalizeTimetableId(
                                lesson.subjectId ??
                                lesson.subject_id
                            );


                        const sessionSubject =
                            subjectId ||
                            normalizeTimetableId(
                                lesson.lessonId ??
                                lesson.taskId
                            );


                        if (
                            !sessionSubject
                        ) {

                            return;

                        }


                        uniqueSessions.add(
                            `${periodId}__${sessionSubject}`
                        );

                    }
                );

            }
        );

    }


    // ========================================================
    // FALLBACK
    // ========================================================

    if (
        uniqueSessions.size === 0 &&
        indexes.teacherPeriod instanceof Set
    ) {

        indexes.teacherPeriod.forEach(
            key => {

                const prefix =
                    `${normalizedTeacherId}__`;


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


                uniqueSessions.add(
                    `${periodId}__NO_SUBJECT`
                );

            }
        );

    }


    return uniqueSessions.size;

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


    if (
        !normalizedStreamId
    ) {

        return 0;

    }


    if (
        !(indexes.streamPeriod instanceof Set)
    ) {

        return 0;

    }


    // ========================================================
    // BUILD PERIOD LOOKUP
    // ========================================================

    const periodMap =
        new Map();


    periods.forEach(
        period => {

            if (
                !period ||
                period.id === null ||
                period.id === undefined
            ) {

                return;

            }


            const periodId =
                normalizeTimetableId(
                    period.id
                );


            if (
                !periodId
            ) {

                return;

            }


            periodMap.set(
                periodId,
                period
            );

        }
    );


    // ========================================================
    // COUNT STREAM PERIODS
    // ========================================================
    //
    // streamPeriod contains:
    //
    //     stream + period
    //
    // Therefore a parallel lesson does NOT artificially
    // increase the stream's daily count.
    //
    // Example:
    //
    // Stream 8A
    // Mathematics P3
    // English P3
    //
    // = ONE occupied stream period.
    //
    // ========================================================

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
                !period
            ) {

                return;

            }


            const periodDay =
                Number(
                    period.dayNumber ??
                    period.day_number
                );


            if (
                periodDay ===
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
    // PARALLEL GROUP SYNCHRONIZATION
    // ========================================================
    //
    // If another lesson belonging to the SAME explicit
    // parallel group is already placed in this stream and
    // period, strongly prefer this period.
    //
    // This keeps all members of a parallel group together.
    //
    // IMPORTANT:
    //
    // This is ONLY a scoring preference.
    //
    // The final validity decision is still made by:
    //
    //     checkSingleSlotConflict()
    //
    // Therefore this does not weaken any existing conflict
    // validation.
    //
    // ========================================================

    const taskParallelGroup =
        normalizeTimetableId(
            task.parallelGroup ??
            task.parallel_group
        );


    if (
        taskParallelGroup
    ) {

        const studentGroups =
            getTaskStudentGroups(
                task
            );


        let parallelGroupMatches =
            0;


        for (
            const studentGroupId of studentGroups
        ) {

            if (
                !studentGroupId
            ) {

                continue;

            }


           const normalizedStudentGroupId =
    normalizeTimetableId(
        studentGroupId
    );

const normalizedPeriodId =
    normalizeTimetableId(
        period.id
    );

const studentGroupKey =
    `${normalizedStudentGroupId}__${normalizedPeriodId}`;

            const existingLessons =
                indexes.studentGroupPeriodLessons instanceof Map
                    ? (
                        indexes.studentGroupPeriodLessons.get(
                            studentGroupKey
                        ) || []
                    )
                    : [];


            for (
                const existingLesson of existingLessons
            ) {

                if (
                    !existingLesson
                ) {

                    continue;

                }


                const existingParallelGroup =
                    normalizeTimetableId(
                        existingLesson.parallelGroup ??
                        existingLesson.parallel_group
                    );


                if (
                    existingParallelGroup &&
                    existingParallelGroup ===
                        taskParallelGroup
                ) {

                    parallelGroupMatches++;

                }

            }

        }


        if (
            parallelGroupMatches > 0
        ) {

            // ------------------------------------------------
            // Very strong preference:
            //
            // Keep all members of an explicit parallel group
            // in the same period.
            // ------------------------------------------------

            score +=
                1000;


            reasons.push(
                "Matches an existing lesson in the same parallel group and period."
            );

        }

    }


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


    if (
        !Array.isArray(teachingPeriods) ||
        teachingPeriods.length === 0
    ) {

        return [];

    }


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
    // PARALLEL GROUP
    // ========================================================

    const taskParallelGroup =
        normalizeTimetableId(
            task.parallelGroup ??
            task.parallel_group
        );


    const taskStudentGroups =
        getTaskStudentGroups(
            task
        );


    // ========================================================
    // FIND ESTABLISHED PARALLEL-GROUP PERIODS
    // ========================================================
    //
    // OPTIMIZED:
    //
    // Instead of scanning every teaching period for every
    // student group, scan the existing occupancy entries once.
    //
    // Once another member of this parallel group has been
    // placed, this task MUST use the same period.
    //
    // ========================================================

    const synchronizedPeriodIds =
        new Set();


    if (
        taskParallelGroup &&
        indexes.studentGroupPeriodLessons instanceof Map &&
        Array.isArray(taskStudentGroups) &&
        taskStudentGroups.length > 0
    ) {

        const normalizedStudentGroupIds =
            new Set(
                taskStudentGroups
                    .map(
                        rawStudentGroupId =>
                            normalizeTimetableId(
                                rawStudentGroupId
                            )
                    )
                    .filter(
                        Boolean
                    )
            );


        if (
            normalizedStudentGroupIds.size > 0
        ) {

            for (
                const [
                    key,
                    existingLessons
                ]
                of indexes.studentGroupPeriodLessons.entries()
            ) {

                if (
                    !Array.isArray(
                        existingLessons
                    ) ||
                    existingLessons.length === 0
                ) {

                    continue;

                }


                const separatorIndex =
                    String(
                        key
                    ).lastIndexOf(
                        "__"
                    );


                if (
                    separatorIndex < 0
                ) {

                    continue;

                }


                const keyStudentGroupId =
                    normalizeTimetableId(
                        String(
                            key
                        ).slice(
                            0,
                            separatorIndex
                        )
                    );


                if (
                    !normalizedStudentGroupIds.has(
                        keyStudentGroupId
                    )
                ) {

                    continue;

                }


                const periodId =
                    normalizeTimetableId(
                        String(
                            key
                        ).slice(
                            separatorIndex + 2
                        )
                    );


                if (
                    !periodId
                ) {

                    continue;

                }


                const hasMatchingParallelLesson =
                    existingLessons.some(
                        existingLesson => {

                            if (
                                !existingLesson
                            ) {

                                return false;

                            }


                            const existingParallelGroup =
                                normalizeTimetableId(
                                    existingLesson.parallelGroup ??
                                    existingLesson.parallel_group
                                );


                            return (
                                existingParallelGroup &&
                                existingParallelGroup ===
                                taskParallelGroup
                            );

                        }
                    );


                if (
                    hasMatchingParallelLesson
                ) {

                    synchronizedPeriodIds.add(
                        periodId
                    );

                }

            }

        }

    }


    const parallelGroupEstablished =
        synchronizedPeriodIds.size > 0;


    // ========================================================
    // TEST EVERY PERIOD
    // ========================================================

    teachingPeriods.forEach(
        period => {

            if (
                !period
            ) {

                return;

            }


            const periodId =
                normalizeTimetableId(
                    period.id
                );


            if (
                !periodId
            ) {

                return;

            }


            // ==================================================
            // HARD PARALLEL SYNCHRONIZATION
            // ==================================================
            //
            // If another member of this parallel group has
            // already been placed, this task may ONLY use one
            // of those synchronized periods.
            //
            // ==================================================

            if (
                parallelGroupEstablished &&
                !synchronizedPeriodIds.has(
                    periodId
                )
            ) {

                return;

            }


            const candidateRooms =
                task.requiresRoom
                    ? compatibleRooms
                    : [null];


            candidateRooms.forEach(
                room => {

                    // ========================================
                    // VALIDATE
                    // ========================================

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


                    // ========================================
                    // SCORE
                    // ========================================

                    const scoring =
                        calculateCandidateSlotScore(
                            task,
                            period,
                            room,
                            data,
                            indexes
                        );


                    if (
                        !scoring ||
                        !Number.isFinite(
                            scoring.score
                        )
                    ) {

                        return;

                    }


                    let score =
                        Number(
                            scoring.score
                        );


                    const reasons =
                        Array.isArray(
                            scoring.reasons
                        )
                            ? [
                                ...scoring.reasons
                            ]
                            : [];


                    // ========================================
                    // SYNCHRONIZED GROUP BONUS
                    // ========================================

                    if (
                        parallelGroupEstablished &&
                        synchronizedPeriodIds.has(
                            periodId
                        )
                    ) {

                        score +=
                            100000;


                        reasons.push(
                            "Uses the established synchronized period for the parallel group."
                        );

                    }


                    candidates.push({

                        taskId:
                            task.taskId ??
                            task.task_id,

                        period,

                        room,

                        score,

                        reasons

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


            const aPeriod =
                Number(
                    a.period?.periodOrder ??
                    a.period?.period_order
                ) || 0;


            const bPeriod =
                Number(
                    b.period?.periodOrder ??
                    b.period?.period_order
                ) || 0;


            if (
                aPeriod !==
                bPeriod
            ) {

                return (
                    aPeriod -
                    bPeriod
                );

            }


            return String(
                a.room?.id ||
                ""
            ).localeCompare(
                String(
                    b.room?.id ||
                    ""
                )
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
    // NORMALIZED IDS
    // ========================================================

    const taskRequirementId =
        normalizeTimetableId(
            task.requirementId ??
            task.requirement_id
        );


    const taskStreamId =
        normalizeTimetableId(
            task.streamId ??
            task.stream_id
        );


    const taskTeacherId =
        normalizeTimetableId(
            task.teacherId ??
            task.teacher_id
        );


    const taskParallelGroup =
        getTaskParallelGroup(
            task
        );


    const firstPeriodId =
        normalizeTimetableId(
            firstPeriod.id
        );


    const secondPeriodId =
        normalizeTimetableId(
            secondPeriod.id
        );


    // ========================================================
    // DAY
    // ========================================================

    const dayNumber =
        Number(
            firstPeriod.dayNumber ??
            firstPeriod.day_number
        );


    // ========================================================
    // PARALLEL-GROUP SYNCHRONIZATION
    // ========================================================
    //
    // If this task belongs to a parallel group, strongly prefer
    // the same TWO periods already being used by another lesson
    // in that parallel group.
    //
    // This helps keep parallel lessons synchronized and prevents
    // an early valid double placement from consuming a different
    // pair of periods and making later parallel tasks impossible.
    //
    // IMPORTANT:
    // This is scoring only.
    //
    // The actual conflict rules are still enforced by
    // checkDoubleLessonConflict().
    //
    // ========================================================

    if (
        taskParallelGroup &&
        indexes.studentGroupPeriodLessons instanceof Map
    ) {

        let synchronizedFirstPeriod =
            false;

        let synchronizedSecondPeriod =
            false;


        const taskStudentGroups =
            getTaskStudentGroups(
                task
            );


        if (
            Array.isArray(taskStudentGroups) &&
            taskStudentGroups.length > 0
        ) {

            for (
                const rawStudentGroupId
                of taskStudentGroups
            ) {

                const studentGroupId =
                    normalizeTimetableId(
                        rawStudentGroupId
                    );


                if (
                    !studentGroupId
                ) {

                    continue;

                }


                const firstKey =
                    `${studentGroupId}__${firstPeriodId}`;


                const secondKey =
                    `${studentGroupId}__${secondPeriodId}`;


                const firstExistingLessons =
                    indexes.studentGroupPeriodLessons.get(
                        firstKey
                    ) || [];


                const secondExistingLessons =
                    indexes.studentGroupPeriodLessons.get(
                        secondKey
                    ) || [];


                const firstMatches =
                    Array.isArray(
                        firstExistingLessons
                    ) &&
                    firstExistingLessons.some(
                        existingLesson => {

                            const existingParallelGroup =
                                normalizeTimetableId(
                                    existingLesson.parallelGroup ??
                                    existingLesson.parallel_group
                                );


                            return (
                                existingParallelGroup &&
                                existingParallelGroup ===
                                taskParallelGroup
                            );

                        }
                    );


                const secondMatches =
                    Array.isArray(
                        secondExistingLessons
                    ) &&
                    secondExistingLessons.some(
                        existingLesson => {

                            const existingParallelGroup =
                                normalizeTimetableId(
                                    existingLesson.parallelGroup ??
                                    existingLesson.parallel_group
                                );


                            return (
                                existingParallelGroup &&
                                existingParallelGroup ===
                                taskParallelGroup
                            );

                        }
                    );


                if (
                    firstMatches
                ) {

                    synchronizedFirstPeriod =
                        true;

                }


                if (
                    secondMatches
                ) {

                    synchronizedSecondPeriod =
                        true;

                }

            }

        }


        if (
            synchronizedFirstPeriod &&
            synchronizedSecondPeriod
        ) {

            score += 100000;

            reasons.push(
                "Double lesson is synchronized with the existing parallel group in both periods."
            );

        }
        else if (
            synchronizedFirstPeriod ||
            synchronizedSecondPeriod
        ) {

            score += 25000;

            reasons.push(
                "Double lesson partially matches the existing parallel group timing."
            );

        }

    }


    // ========================================================
    // REQUIREMENT DAILY COUNT
    // ========================================================
    //
    // A double occupies TWO periods.
    //
    // However, the requirement lesson count treats the double
    // as ONE lesson/session for daily frequency purposes.
    //
    // ========================================================

    const currentRequirementDailyCount =
        getDailyRequirementLessonCount(
            indexes,
            taskRequirementId,
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
            taskStreamId,
            dayNumber,
            data.periods
        );


    // IMPORTANT:
    //
    // A double lesson occupies TWO periods in the stream.

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
        taskTeacherId
    ) {

        const teacherDailyCount =
            getTeacherDailyLessonCountFromPeriods(
                indexes,
                taskTeacherId,
                dayNumber,
                data.periods
            );


        const projectedTeacherDailyCount =
            teacherDailyCount + 2;


        const teacher =
            data.lookup.teachers.get(
                taskTeacherId
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
        taskTeacherId
    ) {

        const teacher =
            data.lookup.teachers.get(
                taskTeacherId
            );


        const weeklyCount =
            getTeacherWeeklyLessonCount(
                indexes,
                taskTeacherId
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
        Array.isArray(
            data.periods
        )
            ? data.periods.filter(
                period =>
                    Number(
                        period.dayNumber ??
                        period.day_number
                    ) ===
                    dayNumber
            )
            : [];


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
        Number(
            firstPeriod.dayNumber ??
            firstPeriod.day_number
        ) ===
        Number(
            secondPeriod.dayNumber ??
            secondPeriod.day_number
        )
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
        !Array.isArray(pairs) ||
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

            if (
                !pair ||
                !pair.first ||
                !pair.second
            ) {

                return;

            }


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


                    if (
                        !scoring ||
                        !Number.isFinite(
                            scoring.score
                        )
                    ) {

                        return;

                    }


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
                            Array.isArray(
                                scoring.reasons
                            )
                                ? scoring.reasons
                                : []

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


            // Preserve some variation between equally scored
            // valid candidates.

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
        !Array.isArray(candidates) ||
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
    // NORMALIZED PERIOD IDS
    // ========================================================

    const firstPeriodId =
        normalizeTimetableId(
            firstPeriod.id
        );


    const secondPeriodId =
        normalizeTimetableId(
            secondPeriod.id
        );


    if (
        !firstPeriodId ||
        !secondPeriodId
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Double lesson contains an invalid period ID."

        };

    }


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
    //
    // Candidate scoring happened earlier.
    //
    // We MUST validate again immediately before reservation
    // because occupancy may have changed since the candidate
    // was generated.
    //
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
        // Roll back first reservation.
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
    //
    // Both reservations already happened.
    //
    // Roll back BOTH periods.
    //
    // There is NO separate requirement-count restoration here.
    //
    // reserveSlot() tracks daily requirement lessons through
    // a unique requirement/day/lesson key, so the two periods
    // of one double lesson remain ONE requirement lesson.
    //
    // ========================================================

    if (
        !firstEntry ||
        !secondEntry
    ) {

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
            firstPeriodId,
            secondPeriodId
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
// IMPORTANT:
//
// Also releases:
//     - student-group occupancy
//     - teacher-period lesson tracking
//
// This is required so failed double-lesson attempts do not
// leave stale conflict reservations behind.
//
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


    // ========================================================
    // NORMALIZED IDS
    // ========================================================

    const streamId =
        normalizeTimetableId(
            task.streamId ??
            task.stream_id
        );


    const periodId =
        normalizeTimetableId(
            period.id
        );


    if (
        !periodId
    ) {

        return false;

    }


    const taskId =
        normalizeTimetableId(
            task.taskId ??
            task.task_id ??
            task.id
        );


    const lessonId =
        normalizeTimetableId(
            task.lessonId ??
            task.lesson_id
        );


    const teacherId =
        normalizeTimetableId(
            task.teacherId ??
            task.teacher_id
        );


    const subjectId =
        normalizeTimetableId(
            task.subjectId ??
            task.subject_id
        );


    const requirementId =
        normalizeTimetableId(
            task.requirementId ??
            task.requirement_id
        );


    // ========================================================
    // STUDENT GROUPS
    // ========================================================

    const studentGroups =
        getTaskStudentGroups(
            task
        );


    // ========================================================
    // STUDENT GROUP / PERIOD LESSON DETAILS
    // ========================================================
    //
    // Remove ONLY this task/lesson.
    //
    // Other parallel lessons must remain.
    //
    // ========================================================

    if (
        indexes.studentGroupPeriodLessons instanceof Map
    ) {

        studentGroups.forEach(
            groupId => {

                const normalizedGroupId =
                    normalizeTimetableId(
                        groupId
                    );


                if (
                    !normalizedGroupId
                ) {

                    return;

                }


                const studentGroupKey =
                    `${normalizedGroupId}__${periodId}`;


                const lessons =
                    indexes.studentGroupPeriodLessons.get(
                        studentGroupKey
                    );


                if (
                    !Array.isArray(
                        lessons
                    )
                ) {

                    return;

                }


                const remainingLessons =
                    lessons.filter(
                        lesson => {

                            const existingTaskId =
                                normalizeTimetableId(
                                    lesson?.taskId ??
                                    lesson?.task_id
                                );


                            const existingLessonId =
                                normalizeTimetableId(
                                    lesson?.lessonId ??
                                    lesson?.lesson_id
                                );


                            // --------------------------------
                            // Match by task ID first
                            // --------------------------------

                            if (
                                taskId &&
                                existingTaskId ===
                                taskId
                            ) {

                                return false;

                            }


                            // --------------------------------
                            // Match by lesson ID when supplied
                            // --------------------------------

                            if (
                                lessonId &&
                                existingLessonId ===
                                lessonId
                            ) {

                                return false;

                            }


                            return true;

                        }
                    );


                if (
                    remainingLessons.length > 0
                ) {

                    indexes.studentGroupPeriodLessons.set(
                        studentGroupKey,
                        remainingLessons
                    );

                }
                else {

                    indexes.studentGroupPeriodLessons.delete(
                        studentGroupKey
                    );

                }

            }
        );

    }


    // ========================================================
    // STUDENT GROUP / PERIOD
    // ========================================================
    //
    // Only remove the simple occupancy index when there are
    // no remaining lessons for that student group and period.
    //
    // This preserves legitimate parallel teaching.
    //
    // ========================================================

    if (
        indexes.studentGroupPeriod
    ) {

        studentGroups.forEach(
            groupId => {

                const normalizedGroupId =
                    normalizeTimetableId(
                        groupId
                    );


                if (
                    !normalizedGroupId
                ) {

                    return;

                }


                const studentGroupKey =
                    `${normalizedGroupId}__${periodId}`;


                let groupStillOccupied =
                    false;


                if (
                    indexes.studentGroupPeriodLessons instanceof Map
                ) {

                    const remainingLessons =
                        indexes.studentGroupPeriodLessons.get(
                            studentGroupKey
                        );


                    groupStillOccupied =
                        Array.isArray(
                            remainingLessons
                        ) &&
                        remainingLessons.length > 0;

                }


                if (
                    !groupStillOccupied
                ) {

                    indexes.studentGroupPeriod.delete(
                        studentGroupKey
                    );

                }

            }
        );

    }


    // ========================================================
    // STREAM / PERIOD
    // ========================================================
    //
    // IMPORTANT:
    //
    // This MUST happen AFTER removing the current lesson from
    // studentGroupPeriodLessons.
    //
    // Otherwise the lesson being released is still visible and
    // streamPeriod can never be correctly cleared.
    //
    // Multiple legitimate parallel lessons may share the same
    // stream + period, so we only delete streamPeriod when no
    // student-group lesson remains for this stream/period.
    //
    // ========================================================

    if (
        streamId &&
        indexes.streamPeriod
    ) {

        let streamStillOccupied =
            false;


        if (
            indexes.studentGroupPeriodLessons instanceof Map &&
            studentGroups.length > 0
        ) {

            for (
                const groupId
                of studentGroups
            ) {

                const normalizedGroupId =
                    normalizeTimetableId(
                        groupId
                    );


                if (
                    !normalizedGroupId
                ) {

                    continue;

                }


                const studentGroupKey =
                    `${normalizedGroupId}__${periodId}`;


                const remainingLessons =
                    indexes.studentGroupPeriodLessons.get(
                        studentGroupKey
                    );


                if (
                    Array.isArray(
                        remainingLessons
                    ) &&
                    remainingLessons.length > 0
                ) {

                    streamStillOccupied =
                        true;

                    break;

                }

            }

        }


        // ----------------------------------------------------
        // If the task has no student groups, use the stream
        // period index itself as the fallback.
        // ----------------------------------------------------

        if (
            studentGroups.length === 0
        ) {

            let anotherStreamLesson =
                false;


            if (
                indexes.taskPeriod instanceof Set
            ) {

                const taskPrefix =
                    `${taskId}__`;


                for (
                    const key of indexes.taskPeriod
                ) {

                    if (
                        typeof key !==
                        "string" ||
                        !key.startsWith(
                            taskPrefix
                        )
                    ) {

                        continue;

                    }


                    const indexedPeriodId =
                        key.slice(
                            taskPrefix.length
                        );


                    if (
                        indexedPeriodId ===
                        periodId
                    ) {

                        continue;

                    }

                }

            }


            anotherStreamLesson =
                false;

        }


        if (
            !streamStillOccupied
        ) {

            indexes.streamPeriod.delete(
                `${streamId}__${periodId}`
            );

        }

    }


    // ========================================================
    // TASK / PERIOD
    // ========================================================

    if (
        taskId &&
        indexes.taskPeriod
    ) {

        indexes.taskPeriod.delete(
            `${taskId}__${periodId}`
        );

    }


    // ========================================================
    // TEACHER PERIOD LESSON TRACKING
    // ========================================================
    //
    // Remove ONLY this task/lesson.
    //
    // Other concurrent lessons for the same teacher/period
    // must remain.
    //
    // ========================================================

    if (
        teacherId &&
        indexes.teacherPeriodLessons instanceof Map
    ) {

        const teacherKey =
            `${teacherId}__${periodId}`;


        const teacherLessons =
            indexes.teacherPeriodLessons.get(
                teacherKey
            );


        if (
            Array.isArray(
                teacherLessons
            )
        ) {

            const remainingLessons =
                teacherLessons.filter(
                    lesson => {

                        const existingTaskId =
                            normalizeTimetableId(
                                lesson?.taskId ??
                                lesson?.task_id
                            );


                        const existingLessonId =
                            normalizeTimetableId(
                                lesson?.lessonId ??
                                lesson?.lesson_id
                            );


                        if (
                            taskId &&
                            existingTaskId ===
                            taskId
                        ) {

                            return false;

                        }


                        if (
                            lessonId &&
                            existingLessonId ===
                            lessonId
                        ) {

                            return false;

                        }


                        return true;

                    }
                );


            if (
                remainingLessons.length > 0
            ) {

                indexes.teacherPeriodLessons.set(
                    teacherKey,
                    remainingLessons
                );

            }
            else {

                indexes.teacherPeriodLessons.delete(
                    teacherKey
                );

            }

        }

    }


    // ========================================================
    // TEACHER / PERIOD
    // ========================================================

    if (
        teacherId &&
        indexes.teacherPeriod
    ) {

        const teacherKey =
            `${teacherId}__${periodId}`;


        const remainingTeacherLessons =
            indexes.teacherPeriodLessons instanceof Map
                ? indexes.teacherPeriodLessons.get(
                    teacherKey
                )
                : null;


        if (
            !Array.isArray(
                remainingTeacherLessons
            ) ||
            remainingTeacherLessons.length === 0
        ) {

            indexes.teacherPeriod.delete(
                teacherKey
            );

        }

    }


    // ========================================================
    // TEACHER + SUBJECT + PERIOD
    // ========================================================

    if (
        teacherId &&
        subjectId &&
        indexes.teacherSubjectPeriod
    ) {

        const teacherSubjectPeriodKey =
            `${teacherId}__${subjectId}__${periodId}`;


        let anotherMatchingLesson =
            false;


        if (
            indexes.teacherPeriodLessons instanceof Map
        ) {

            const teacherKey =
                `${teacherId}__${periodId}`;


            const remainingLessons =
                indexes.teacherPeriodLessons.get(
                    teacherKey
                );


            if (
                Array.isArray(
                    remainingLessons
                )
            ) {

                anotherMatchingLesson =
                    remainingLessons.some(
                        lesson => {

                            const existingSubjectId =
                                normalizeTimetableId(
                                    lesson?.subjectId ??
                                    lesson?.subject_id
                                );


                            return (
                                existingSubjectId ===
                                subjectId
                            );

                        }
                    );

            }

        }


        if (
            !anotherMatchingLesson
        ) {

            indexes.teacherSubjectPeriod.delete(
                teacherSubjectPeriodKey
            );

        }

    }


    // ========================================================
    // ROOM / PERIOD
    // ========================================================

    if (
        room &&
        room.id &&
        indexes.roomPeriod
    ) {

        const roomId =
            normalizeTimetableId(
                room.id
            );


        if (
            roomId
        ) {

            indexes.roomPeriod.delete(
                `${roomId}__${periodId}`
            );

        }

    }


    // ========================================================
    // DAY
    // ========================================================

    const dayNumber =
        Number(
            period.dayNumber ??
            period.day_number
        );


    if (
        Number.isFinite(
            dayNumber
        )
    ) {

        // ====================================================
        // TEACHER DAY
        // ====================================================

        if (
            teacherId &&
            indexes.teacherDay instanceof Map
        ) {

            const teacherDays =
                indexes.teacherDay.get(
                    teacherId
                );


            if (
                teacherDays instanceof Set
            ) {

                let teacherStillOnDay =
                    false;


                if (
                    indexes.teacherPeriodLessons instanceof Map
                ) {

                    for (
                        const [
                            teacherPeriodKey,
                            lessons
                        ]
                        of indexes.teacherPeriodLessons.entries()
                    ) {

                        if (
                            !Array.isArray(
                                lessons
                            ) ||
                            lessons.length === 0
                        ) {

                            continue;

                        }


                        const separatorIndex =
                            teacherPeriodKey.lastIndexOf(
                                "__"
                            );


                        if (
                            separatorIndex === -1
                        ) {

                            continue;

                        }


                        const indexedTeacherId =
                            teacherPeriodKey.slice(
                                0,
                                separatorIndex
                            );


                        if (
                            indexedTeacherId !==
                            teacherId
                        ) {

                            continue;

                        }


                        const indexedPeriodId =
                            teacherPeriodKey.slice(
                                separatorIndex + 2
                            );


                        const indexedPeriod =
                            getIndexedPeriod(
                                indexes,
                                indexedPeriodId
                            );


                        if (
                            !indexedPeriod
                        ) {

                            continue;

                        }


                        const indexedDay =
                            Number(
                                indexedPeriod.dayNumber ??
                                indexedPeriod.day_number
                            );


                        if (
                            Number.isFinite(
                                indexedDay
                            ) &&
                            indexedDay ===
                            dayNumber
                        ) {

                            teacherStillOnDay =
                                true;

                            break;

                        }

                    }

                }


                if (
                    !teacherStillOnDay
                ) {

                    teacherDays.delete(
                        dayNumber
                    );

                }


                if (
                    teacherDays.size === 0
                ) {

                    indexes.teacherDay.delete(
                        teacherId
                    );

                }

            }

        }


        // ====================================================
        // STREAM DAY
        // ====================================================

        if (
            streamId &&
            indexes.streamDay instanceof Map
        ) {

            const streamDays =
                indexes.streamDay.get(
                    streamId
                );


            if (
                streamDays instanceof Set
            ) {

                let streamStillOnDay =
                    false;


                if (
                    indexes.streamPeriod instanceof Set
                ) {

                    const prefix =
                        `${streamId}__`;


                    for (
                        const key of indexes.streamPeriod
                    ) {

                        if (
                            typeof key !==
                            "string" ||
                            !key.startsWith(
                                prefix
                            )
                        ) {

                            continue;

                        }


                        const indexedPeriodId =
                            key.slice(
                                prefix.length
                            );


                        const indexedPeriod =
                            getIndexedPeriod(
                                indexes,
                                indexedPeriodId
                            );


                        if (
                            !indexedPeriod
                        ) {

                            continue;

                        }


                        const indexedDay =
                            Number(
                                indexedPeriod.dayNumber ??
                                indexedPeriod.day_number
                            );


                        if (
                            Number.isFinite(
                                indexedDay
                            ) &&
                            indexedDay ===
                            dayNumber
                        ) {

                            streamStillOnDay =
                                true;

                            break;

                        }

                    }

                }


                if (
                    !streamStillOnDay
                ) {

                    streamDays.delete(
                        dayNumber
                    );

                }


                if (
                    streamDays.size === 0
                ) {

                    indexes.streamDay.delete(
                        streamId
                    );

                }

            }

        }


        // ====================================================
        // STUDENT GROUP DAY
        // ====================================================

        if (
            indexes.studentGroupDay instanceof Map
        ) {

            studentGroups.forEach(
                groupId => {

                    const normalizedGroupId =
                        normalizeTimetableId(
                            groupId
                        );


                    if (
                        !normalizedGroupId
                    ) {

                        return;

                    }


                    const groupDays =
                        indexes.studentGroupDay.get(
                            normalizedGroupId
                        );


                    if (
                        !(groupDays instanceof Set)
                    ) {

                        return;

                    }


                    let groupStillOnDay =
                        false;


                    if (
                        indexes.studentGroupPeriod instanceof Set
                    ) {

                        const prefix =
                            `${normalizedGroupId}__`;


                        for (
                            const key of indexes.studentGroupPeriod
                        ) {

                            if (
                                typeof key !==
                                "string" ||
                                !key.startsWith(
                                    prefix
                                )
                            ) {

                                continue;

                            }


                            const indexedPeriodId =
                                key.slice(
                                    prefix.length
                                );


                            const indexedPeriod =
                                getIndexedPeriod(
                                    indexes,
                                    indexedPeriodId
                                );


                            if (
                                !indexedPeriod
                            ) {

                                continue;

                            }


                            const indexedDay =
                                Number(
                                    indexedPeriod.dayNumber ??
                                    indexedPeriod.day_number
                                );


                            if (
                                Number.isFinite(
                                    indexedDay
                                ) &&
                                indexedDay ===
                                dayNumber
                            ) {

                                groupStillOnDay =
                                    true;

                                break;

                            }

                        }

                    }


                    if (
                        !groupStillOnDay
                    ) {

                        groupDays.delete(
                            dayNumber
                        );

                    }


                    if (
                        groupDays.size === 0
                    ) {

                        indexes.studentGroupDay.delete(
                            normalizedGroupId
                        );

                    }

                }
            );

        }


        // ====================================================
        // ROOM DAY
        // ====================================================

        if (
            room &&
            room.id &&
            indexes.roomDay instanceof Map
        ) {

            const roomId =
                normalizeTimetableId(
                    room.id
                );


            if (
                roomId
            ) {

                const roomDays =
                    indexes.roomDay.get(
                        roomId
                    );


                if (
                    roomDays instanceof Set
                ) {

                    let roomStillOnDay =
                        false;


                    if (
                        indexes.roomPeriod instanceof Set
                    ) {

                        const prefix =
                            `${roomId}__`;


                        for (
                            const key of indexes.roomPeriod
                        ) {

                            if (
                                typeof key !==
                                "string" ||
                                !key.startsWith(
                                    prefix
                                )
                            ) {

                                continue;

                            }


                            const indexedPeriodId =
                                key.slice(
                                    prefix.length
                                );


                            const indexedPeriod =
                                getIndexedPeriod(
                                    indexes,
                                    indexedPeriodId
                                );


                            if (
                                !indexedPeriod
                            ) {

                                continue;

                            }


                            const indexedDay =
                                Number(
                                    indexedPeriod.dayNumber ??
                                    indexedPeriod.day_number
                                );


                            if (
                                Number.isFinite(
                                    indexedDay
                                ) &&
                                indexedDay ===
                                dayNumber
                            ) {

                                roomStillOnDay =
                                    true;

                                break;

                            }

                        }

                    }


                    if (
                        !roomStillOnDay
                    ) {

                        roomDays.delete(
                            dayNumber
                        );

                    }


                    if (
                        roomDays.size === 0
                    ) {

                        indexes.roomDay.delete(
                            roomId
                        );

                    }

                }

            }

        }


        // ====================================================
        // REQUIREMENT DAY
        // ====================================================

        if (
            requirementId &&
            indexes.requirementDay instanceof Map
        ) {

            const requirementDays =
                indexes.requirementDay.get(
                    requirementId
                );


            if (
                requirementDays instanceof Set
            ) {

                const count =
                    getDailyRequirementLessonCount(
                        indexes,
                        requirementId,
                        dayNumber
                    );


                if (
                    count <= 0
                ) {

                    requirementDays.delete(
                        dayNumber
                    );

                }


                if (
                    requirementDays.size === 0
                ) {

                    indexes.requirementDay.delete(
                        requirementId
                    );

                }

            }

        }

    }


    // ========================================================
    // DAILY REQUIREMENT LESSON COUNT
    // ========================================================
    //
    // A double lesson occupies TWO periods but counts as ONE
    // requirement lesson.
    //
    // Therefore:
    //
    // first release  -> count remains unchanged
    // second release -> count decreases by one
    //
    // ========================================================

    if (
        requirementId &&
        Number.isFinite(dayNumber) &&
        indexes.dailyRequirementLessons
    ) {

        const dailyKey =
            getDailyRequirementKey(
                requirementId,
                dayNumber
            );


        const lessonKey =
            lessonId ||
            taskId;


        let anotherTaskPeriodRemains =
            false;


        if (
            taskId &&
            indexes.taskPeriod instanceof Set
        ) {

            const taskPrefix =
                `${taskId}__`;


            for (
                const indexedTaskPeriod
                of indexes.taskPeriod
            ) {

                if (
                    typeof indexedTaskPeriod !==
                    "string" ||
                    !indexedTaskPeriod.startsWith(
                        taskPrefix
                    )
                ) {

                    continue;

                }


                const remainingPeriodId =
                    indexedTaskPeriod.slice(
                        taskPrefix.length
                    );


                const remainingPeriod =
                    getIndexedPeriod(
                        indexes,
                        remainingPeriodId
                    );


                if (
                    !remainingPeriod
                ) {

                    continue;

                }


                const remainingDay =
                    Number(
                        remainingPeriod.dayNumber ??
                        remainingPeriod.day_number
                    );


                if (
                    Number.isFinite(
                        remainingDay
                    ) &&
                    remainingDay ===
                    dayNumber
                ) {

                    anotherTaskPeriodRemains =
                        true;

                    break;

                }

            }

        }


        if (
            !anotherTaskPeriodRemains
        ) {

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
                    dailyKey
                );

            }
            else {

                indexes.dailyRequirementLessons.set(
                    dailyKey,
                    currentCount - 1
                );

            }


            if (
                indexes.dailyRequirementLessonKeys instanceof Set
            ) {

                const prefix =
                    `${dailyKey}__`;


                const keysToRemove =
                    [];


                indexes.dailyRequirementLessonKeys.forEach(
                    uniqueKey => {

                        if (
                            typeof uniqueKey !==
                            "string"
                        ) {

                            return;

                        }


                        if (
                            !uniqueKey.startsWith(
                                prefix
                            )
                        ) {

                            return;

                        }


                        if (
                            lessonKey &&
                            uniqueKey ===
                            `${prefix}${lessonKey}`
                        ) {

                            keysToRemove.push(
                                uniqueKey
                            );

                        }

                    }
                );


                keysToRemove.forEach(
                    uniqueKey => {

                        indexes.dailyRequirementLessonKeys.delete(
                            uniqueKey
                        );

                    }
                );

            }

        }

    }


    return true;

}

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
// STAGE 6E — COUNT AVAILABLE DAYS FOR TASK
// ============================================================
//
// A requirement such as:
//
//     lessonsPerWeek = 5
//     maxLessonsPerDay = 1
//
// needs FIVE DIFFERENT DAYS.
//
// Candidate count alone is therefore not enough.
//
// This function counts the distinct school days represented
// by the currently valid candidates.
// ============================================================

function getTaskAvailableDayCount(
    task,
    candidates
) {

    if (
        !task ||
        !Array.isArray(candidates) ||
        candidates.length === 0
    ) {

        return 0;

    }


    const days =
        new Set();


    candidates.forEach(
        candidate => {

            if (
                !candidate
            ) {

                return;

            }


            // ------------------------------------------------
            // SINGLE LESSON CANDIDATE
            // ------------------------------------------------

            const singlePeriod =
                candidate.period ||
                null;


            // ------------------------------------------------
            // DOUBLE LESSON CANDIDATE
            // ------------------------------------------------

            const doublePeriod =
                candidate.firstPeriod ||
                null;


            const period =
                singlePeriod ||
                doublePeriod;


            if (
                !period
            ) {

                return;

            }


            const dayNumber =
                Number(
                    period.dayNumber ??
                    period.day_number
                );


            if (
                Number.isFinite(
                    dayNumber
                )
            ) {

                days.add(
                    dayNumber
                );

            }

        }
    );


    return days.size;

}


// ============================================================
// STAGE 6E — CALCULATE TASK DAY PRESSURE
// ============================================================
//
// Measures whether a task is running out of usable school
// days.
//
// Example:
//
//     lessonsPerWeek = 5
//     maxPerDay      = 1
//     availableDays  = 5
//
//     requiredDays   = 5
//     deficit        = 0
//
// If only four days remain:
//
//     requiredDays   = 5
//     availableDays  = 4
//     deficit        = 1
//
// That task must be protected and scheduled urgently.
// ============================================================

function getTaskDayPressure(
    task,
    data,
    candidates
) {

    if (
        !task ||
        !data
    ) {

        return {

            requiredDays:
                0,

            availableDays:
                0,

            deficit:
                0

        };

    }


    const requirement =
        getTaskRequirement(
            task,
            data.lookup
        );


    const lessonsPerWeek =
        Number(
            requirement?.lessonsPerWeek
        ) || 0;


    const maxPerDay =
        Number(
            task.maxLessonsPerDay
        ) || 1;


    // --------------------------------------------------------
    // Minimum distinct days required.
    // --------------------------------------------------------
    //
    // Example:
    //
    // 5 lessons / max 1 per day = 5 days
    // 5 lessons / max 2 per day = 3 days
    // 5 lessons / max 3 per day = 2 days
    //
    // --------------------------------------------------------

    const requiredDays =
        maxPerDay > 0
            ? Math.ceil(
                lessonsPerWeek /
                maxPerDay
            )
            : lessonsPerWeek;


    const availableDays =
        getTaskAvailableDayCount(
            task,
            candidates
        );


    const deficit =
        Math.max(
            0,
            requiredDays -
            availableDays
        );


    return {

        requiredDays,

        availableDays,

        deficit

    };

}


// ============================================================
// STAGE 6E — SELECT NEXT SMART TASK
// ============================================================
//
// Combines:
//
// 1. Day pressure
// 2. Candidate availability
// 3. Stage 6B priority
// 4. Best candidate score
// 5. Task duration
// 6. Room requirement
//
// IMPORTANT:
//
// The scheduler now protects requirements that need
// different days before flexible tasks consume those days.
//
// The final tie-break is deterministic.
// No Math.random() is used here.
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


    // ========================================================
    // NORMALIZE REMAINING TASKS
    // ========================================================

    const activeTasks =
        remainingTasks.filter(
            task =>
                task &&
                !task.placed
        );


    if (
        activeTasks.length === 0
    ) {

        return null;

    }


    // ========================================================
    // BUILD PARALLEL GROUP MAP
    // ========================================================

    const parallelGroups =
        new Map();


    activeTasks.forEach(
        task => {

            const parallelGroup =
                normalizeTimetableId(
                    task.parallelGroup ??
                    task.parallel_group
                );


            if (
                !parallelGroup
            ) {

                return;

            }


            if (
                !parallelGroups.has(
                    parallelGroup
                )
            ) {

                parallelGroups.set(
                    parallelGroup,
                    []
                );

            }


            parallelGroups
                .get(
                    parallelGroup
                )
                .push(
                    task
                );

        }
    );


    // ========================================================
    // CACHE PARALLEL-GROUP INFORMATION
    // ========================================================
    //
    // IMPORTANT:
    //
    // Each group's common periods are calculated ONCE.
    //
    // Previously this calculation was repeated for every task
    // belonging to the same group.
    //
    // ========================================================

    const parallelGroupCache =
        new Map();


    parallelGroups.forEach(
        (
            groupTasks,
            parallelGroup
        ) => {

            const groupInfo = {

                established:
                    false,

                establishedPeriods:
                    new Set(),

                commonPeriods:
                    new Set(),

                memberCandidates:
                    new Map(),

                initialized:
                    false

            };


            // ==================================================
            // CHECK WHETHER GROUP IS ALREADY ESTABLISHED
            // ==================================================

            groupTasks.forEach(
                groupTask => {

                    if (
                        groupInfo.established
                    ) {

                        return;

                    }


                    const studentGroups =
                        getTaskStudentGroups(
                            groupTask
                        );


                    if (
                        !Array.isArray(
                            studentGroups
                        ) ||
                        studentGroups.length === 0
                    ) {

                        return;

                    }


                    if (
                        !(indexes.studentGroupPeriodLessons instanceof Map)
                    ) {

                        return;

                    }


                    const normalizedStudentGroupIds =
                        new Set(
                            studentGroups
                                .map(
                                    rawStudentGroupId =>
                                        normalizeTimetableId(
                                            rawStudentGroupId
                                        )
                                )
                                .filter(
                                    Boolean
                                )
                        );


                    if (
                        normalizedStudentGroupIds.size === 0
                    ) {

                        return;

                    }


                    for (
                        const [
                            key,
                            lessons
                        ]
                        of indexes.studentGroupPeriodLessons.entries()
                    ) {

                        if (
                            !Array.isArray(
                                lessons
                            ) ||
                            lessons.length === 0
                        ) {

                            continue;

                        }


                        const separatorIndex =
                            String(
                                key
                            ).lastIndexOf(
                                "__"
                            );


                        if (
                            separatorIndex < 0
                        ) {

                            continue;

                        }


                        const studentGroupId =
                            normalizeTimetableId(
                                String(
                                    key
                                ).slice(
                                    0,
                                    separatorIndex
                                )
                            );


                        if (
                            !normalizedStudentGroupIds.has(
                                studentGroupId
                            )
                        ) {

                            continue;

                        }


                        const periodId =
                            normalizeTimetableId(
                                String(
                                    key
                                ).slice(
                                    separatorIndex + 2
                                )
                            );


                        if (
                            !periodId
                        ) {

                            continue;

                        }


                        const hasMatchingParallelLesson =
                            lessons.some(
                                lesson => {

                                    if (
                                        !lesson
                                    ) {

                                        return false;

                                    }


                                    const lessonParallelGroup =
                                        normalizeTimetableId(
                                            lesson.parallelGroup ??
                                            lesson.parallel_group
                                        );


                                    return (
                                        lessonParallelGroup &&
                                        lessonParallelGroup ===
                                        parallelGroup
                                    );

                                }
                            );


                        if (
                            hasMatchingParallelLesson
                        ) {

                            groupInfo
                                .establishedPeriods
                                .add(
                                    periodId
                                );

                        }

                    }

                }
            );


            if (
                groupInfo.establishedPeriods.size > 0
            ) {

                groupInfo.established =
                    true;


                groupInfo.commonPeriods =
                    new Set(
                        groupInfo.establishedPeriods
                    );

            }
            else {

                // ==============================================
                // GROUP NOT STARTED
                //
                // Calculate candidate periods for every member
                // exactly ONCE.
                // ==============================================

                groupTasks.forEach(
                    groupTask => {

                        // --------------------------------------
                        // Double parallel groups are handled by
                        // the double candidate engine.
                        // --------------------------------------

                        if (
                            groupTask.taskType ===
                            "double"
                        ) {

                            return;

                        }


                        const groupCandidates =
                            getScoredSingleLessonCandidates(
                                groupTask,
                                data,
                                indexes
                            );


                        groupInfo
                            .memberCandidates
                            .set(
                                groupTask,
                                groupCandidates
                            );


                        const groupPeriods =
                            new Set();


                        groupCandidates.forEach(
                            candidate => {

                                const periodId =
                                    normalizeTimetableId(
                                        candidate.period?.id
                                    );


                                if (
                                    periodId
                                ) {

                                    groupPeriods.add(
                                        periodId
                                    );

                                }

                            }
                        );


                        if (
                            !groupInfo.initialized
                        ) {

                            groupInfo.commonPeriods =
                                new Set(
                                    groupPeriods
                                );


                            groupInfo.initialized =
                                true;

                        }
                        else {

                            groupInfo.commonPeriods =
                                new Set(
                                    [
                                        ...groupInfo.commonPeriods
                                    ].filter(
                                        periodId =>
                                            groupPeriods.has(
                                                periodId
                                            )
                                    )
                                );

                        }

                    }
                );

            }


            parallelGroupCache.set(
                parallelGroup,
                groupInfo
            );

        }
    );


    // ========================================================
    // ANALYSE EVERY REMAINING TASK
    // ========================================================

    const taskCandidates = [];


    activeTasks.forEach(
        task => {

            // ==================================================
            // TASK PRIORITY
            // ==================================================

            const priority =
                calculateTaskPriorityScore(
                    task,
                    data
                );


            // ==================================================
            // CURRENT VALID CANDIDATES
            // ==================================================

            let candidates =
                getSmartCandidatesForTask(
                    task,
                    data,
                    indexes
                );


            // ==================================================
            // PARALLEL GROUP
            // ==================================================

            const taskParallelGroup =
                normalizeTimetableId(
                    task.parallelGroup ??
                    task.parallel_group
                );


            let parallelGroupEstablished =
                false;


            let parallelGroupPeriods =
                0;


            let parallelGroupCommonPeriods =
                0;


            if (
                taskParallelGroup &&
                parallelGroupCache.has(
                    taskParallelGroup
                )
            ) {

                const groupInfo =
                    parallelGroupCache.get(
                        taskParallelGroup
                    );


                parallelGroupEstablished =
                    groupInfo.established;


                parallelGroupPeriods =
                    groupInfo.establishedPeriods.size;


                parallelGroupCommonPeriods =
                    groupInfo.commonPeriods.size;


                // ==============================================
                // HARD FILTER — ESTABLISHED GROUP
                // ==============================================

                if (
                    groupInfo.established
                ) {

                    candidates =
                        candidates.filter(
                            candidate => {

                                const periodId =
                                    normalizeTimetableId(
                                        candidate.period?.id
                                    );


                                return groupInfo
                                    .establishedPeriods
                                    .has(
                                        periodId
                                    );

                            }
                        );

                }


                // ==============================================
                // HARD FILTER — UNSTARTED GROUP
                //
                // Only allow periods that every remaining member
                // can use.
                // ==============================================

                else if (
                    groupInfo.commonPeriods.size > 0
                ) {

                    candidates =
                        candidates.filter(
                            candidate => {

                                const periodId =
                                    normalizeTimetableId(
                                        candidate.period?.id
                                    );


                                return groupInfo
                                    .commonPeriods
                                    .has(
                                        periodId
                                    );

                            }
                        );

                }

            }


            // ==================================================
            // CANDIDATE COUNT
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
            // DAY PRESSURE
            // ==================================================

            const dayPressure =
                getTaskDayPressure(
                    task,
                    data,
                    candidates
                );


            // ==================================================
            // STORE
            // ==================================================

            taskCandidates.push({

                task,

                priority,

                candidates,

                candidateCount,

                candidate:
                    bestCandidate,

                requiredDays:
                    dayPressure.requiredDays,

                availableDays:
                    dayPressure.availableDays,

                dayDeficit:
                    dayPressure.deficit,

                parallelGroupEstablished,

                parallelGroupPeriods,

                parallelGroupCommonPeriods

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

    taskCandidates.sort(
        (
            a,
            b
        ) => {

            // ------------------------------------------------
            // 1. IMPOSSIBLE TASKS FIRST
            // ------------------------------------------------

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


            // ------------------------------------------------
            // 2. ESTABLISHED PARALLEL GROUP
            // ------------------------------------------------
            //
            // Once a group has started, finish its members
            // before unrelated tasks take those periods.
            //
            // ------------------------------------------------

            if (
                a.parallelGroupEstablished !==
                b.parallelGroupEstablished
            ) {

                return a.parallelGroupEstablished
                    ? -1
                    : 1;

            }


            // ------------------------------------------------
            // 3. UNSTARTED PARALLEL GROUP CONSTRAINT
            // ------------------------------------------------
            //
            // Groups with fewer common periods are more
            // constrained and should be scheduled earlier.
            //
            // ------------------------------------------------

            if (
                a.parallelGroupCommonPeriods !==
                b.parallelGroupCommonPeriods
            ) {

                if (
                    a.parallelGroupCommonPeriods > 0 &&
                    b.parallelGroupCommonPeriods > 0
                ) {

                    return (
                        a.parallelGroupCommonPeriods -
                        b.parallelGroupCommonPeriods
                    );

                }


                if (
                    a.parallelGroupCommonPeriods > 0 &&
                    b.parallelGroupCommonPeriods === 0
                ) {

                    return -1;

                }


                if (
                    a.parallelGroupCommonPeriods === 0 &&
                    b.parallelGroupCommonPeriods > 0
                ) {

                    return 1;

                }

            }


            // ------------------------------------------------
            // 4. ESTABLISHED GROUP PERIOD COUNT
            // ------------------------------------------------

            if (
                a.parallelGroupPeriods !==
                b.parallelGroupPeriods
            ) {

                return (
                    b.parallelGroupPeriods -
                    a.parallelGroupPeriods
                );

            }


            // ------------------------------------------------
            // 5. CRITICAL DAY DEFICIT
            // ------------------------------------------------

            if (
                a.dayDeficit !==
                b.dayDeficit
            ) {

                return (
                    b.dayDeficit -
                    a.dayDeficit
                );

            }


            // ------------------------------------------------
            // 6. FEWEST AVAILABLE DAYS
            // ------------------------------------------------

            if (
                a.availableDays !==
                b.availableDays
            ) {

                return (
                    a.availableDays -
                    b.availableDays
                );

            }


            // ------------------------------------------------
            // 7. FEWEST CANDIDATES
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
            // 8. HIGHER TASK PRIORITY
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
            // 9. BEST CANDIDATE SCORE
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
            // 10. DOUBLE FIRST
            // ------------------------------------------------

            const durationA =
                Number(
                    a.task.duration ??
                    a.task.lessonDuration ??
                    1
                );


            const durationB =
                Number(
                    b.task.duration ??
                    b.task.lessonDuration ??
                    1
                );


            if (
                durationA !==
                durationB
            ) {

                return (
                    durationB -
                    durationA
                );

            }


            // ------------------------------------------------
            // 11. ROOM REQUIRED
            // ------------------------------------------------

            const requiresRoomA =
                Boolean(
                    a.task.requiresRoom ??
                    a.task.requires_room
                );


            const requiresRoomB =
                Boolean(
                    b.task.requiresRoom ??
                    b.task.requires_room
                );


            if (
                requiresRoomA !==
                requiresRoomB
            ) {

                return requiresRoomA
                    ? -1
                    : 1;

            }


            // ------------------------------------------------
            // 12. DETERMINISTIC TASK ID
            // ------------------------------------------------

            return String(
                a.task.taskId ??
                a.task.task_id ??
                ""
            ).localeCompare(
                String(
                    b.task.taskId ??
                    b.task.task_id ??
                    ""
                )
            );

        }
    );


    // ========================================================
    // SELECT
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
        "STAGE 6E — SMART TASK SELECTION:",
        {

            taskId:
                selected.task?.taskId ??
                selected.task?.task_id ??
                null,

            taskType:
                selected.task?.taskType ??
                selected.task?.task_type ??
                null,

            requirementId:
                selected.task?.requirementId ??
                selected.task?.requirement_id ??
                null,

            parallelGroup:
                selected.task?.parallelGroup ??
                selected.task?.parallel_group ??
                null,

            parallelGroupEstablished:
                selected.parallelGroupEstablished,

            parallelGroupPeriods:
                selected.parallelGroupPeriods,

            parallelGroupCommonPeriods:
                selected.parallelGroupCommonPeriods,

            priority:
                selected.priority,

            availableCandidates:
                selected.candidateCount,

            requiredDays:
                selected.requiredDays,

            availableDays:
                selected.availableDays,

            dayDeficit:
                selected.dayDeficit,

            bestCandidateScore:
                selected.candidate?.score ??
                null

        }
    );


    // ========================================================
    // RETURN
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
            selected.candidateCount,

        requiredDays:
            selected.requiredDays,

        availableDays:
            selected.availableDays,

        dayDeficit:
            selected.dayDeficit,

        parallelGroupEstablished:
            selected.parallelGroupEstablished,

        parallelGroupPeriods:
            selected.parallelGroupPeriods,

        parallelGroupCommonPeriods:
            selected.parallelGroupCommonPeriods

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
    // BUILD TEACHER LIMIT INDEX
    // ========================================================

    if (
        !(indexes.teacherLimits instanceof Map)
    ) {

        indexes.teacherLimits =
            new Map();

    }


    if (
        Array.isArray(data.teachers)
    ) {

        data.teachers.forEach(
            teacher => {

                if (
                    !teacher ||
                    !teacher.id
                ) {

                    return;

                }


                const teacherId =
                    normalizeTimetableId(
                        teacher.id
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

            console.warn(
                "STAGE 6F — NO TASK SELECTION AVAILABLE."
            );

            break;

        }


        const task =
            selection.task;


        if (
            !task
        ) {

            console.warn(
                "STAGE 6F — INVALID TASK SELECTION."
            );

            break;

        }


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
                        task.taskId ??
                        task.task_id ??
                        null,

                    taskType:
                        task.taskType ??
                        task.task_type ??
                        null,

                    streamId:
                        task.streamId ??
                        task.stream_id ??
                        null,

                    subjectId:
                        task.subjectId ??
                        task.subject_id ??
                        null,

                    teacherId:
                        task.teacherId ??
                        task.teacher_id ??
                        null,

                    requirementId:
                        task.requirementId ??
                        task.requirement_id ??
                        null,

                    parallelGroup:
                        task.parallelGroup ??
                        task.parallel_group ??
                        null,

                    parallelGroupEstablished:
                        selection.parallelGroupEstablished ??
                        false,

                    parallelGroupPeriods:
                        selection.parallelGroupPeriods ??
                        0,

                    requiredDays:
                        selection.requiredDays ??
                        0,

                    availableDays:
                        selection.availableDays ??
                        0,

                    dayDeficit:
                        selection.dayDeficit ??
                        0

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

        let successfulPlacement =
            null;


        let successfulCandidate =
            null;


        let lastFailureReason =
            "All candidates failed.";


        for (
            const candidate of selection.candidates
        ) {

            if (
                !candidate
            ) {

                continue;

            }


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
                attempt &&
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
                attempt?.reason ||
                lastFailureReason;


            console.warn(
                "SMART CANDIDATE REJECTED:",
                {

                    taskId:
                        task.taskId ??
                        task.task_id ??
                        null,

                    taskType:
                        task.taskType ??
                        task.task_type ??
                        null,

                    candidateScore:
                        candidate?.score ??
                        null,

                    candidateReason:
                        candidate?.reason ??
                        null,

                    reason:
                        attempt?.reason ||
                        "Candidate rejected."

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

            // ------------------------------------------------
            // ADD GENERATED ENTRIES
            // ------------------------------------------------

            if (
                Array.isArray(
                    successfulPlacement.entries
                )
            ) {

                result.entries.push(
                    ...successfulPlacement.entries
                );

            }


            // ------------------------------------------------
            // TRACK PLACED TASK
            // ------------------------------------------------

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
                        task.taskId ??
                        task.task_id ??
                        null,

                    type:
                        task.taskType ??
                        task.task_type ??
                        null,

                    requirementId:
                        task.requirementId ??
                        task.requirement_id ??
                        null,

                    parallelGroup:
                        task.parallelGroup ??
                        task.parallel_group ??
                        null,

                    periods:
                        task.periodIds ??
                        [],

                    room:
                        task.roomId ??
                        null,

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
                    task.taskId ??
                    task.task_id ??
                    null,

                taskType:
                    task.taskType ??
                    task.task_type ??
                    null,

                requirementId:
                    task.requirementId ??
                    task.requirement_id ??
                    null,

                teacherId:
                    task.teacherId ??
                    task.teacher_id ??
                    null,

                parallelGroup:
                    task.parallelGroup ??
                    task.parallel_group ??
                    null,

                parallelGroupEstablished:
                    selection.parallelGroupEstablished ??
                    false,

                parallelGroupPeriods:
                    selection.parallelGroupPeriods ??
                    0,

                candidateCount:
                    selection.candidateCount,

                requiredDays:
                    selection.requiredDays ??
                    0,

                availableDays:
                    selection.availableDays ??
                    0,

                dayDeficit:
                    selection.dayDeficit ??
                    0,

                reason:
                    lastFailureReason

            }
        );


        result.failedTasks.push({

            task,

            reason:
                lastFailureReason,

            candidateCount:
                selection.candidateCount,

            requiredDays:
                selection.requiredDays,

            availableDays:
                selection.availableDays,

            dayDeficit:
                selection.dayDeficit,

            parallelGroupEstablished:
                selection.parallelGroupEstablished ??
                false,

            parallelGroupPeriods:
                selection.parallelGroupPeriods ??
                0

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

                if (
                    !task
                ) {

                    return;

                }


                result.failedTasks.push({

                    task,

                    reason:
                        "Generator safety iteration limit reached."

                });


                task.placed =
                    false;


                task.periodIds =
                    [];


                task.roomId =
                    null;

            }
        );


        remainingTasks.length =
            0;

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
                        item.task?.taskId ??
                        item.task?.task_id ??
                        null,

                    type:
                        item.task?.taskType ??
                        item.task?.task_type ??
                        null,

                    streamId:
                        item.task?.streamId ??
                        item.task?.stream_id ??
                        null,

                    subjectId:
                        item.task?.subjectId ??
                        item.task?.subject_id ??
                        null,

                    teacherId:
                        item.task?.teacherId ??
                        item.task?.teacher_id ??
                        null,

                    requirementId:
                        item.task?.requirementId ??
                        item.task?.requirement_id ??
                        null,

                    parallelGroup:
                        item.task?.parallelGroup ??
                        item.task?.parallel_group ??
                        null,

                    candidateCount:
                        item.candidateCount ??
                        null,

                    requiredDays:
                        item.requiredDays ??
                        null,

                    availableDays:
                        item.availableDays ??
                        null,

                    dayDeficit:
                        item.dayDeficit ??
                        null,

                    reason:
                        item.reason

                })
            )
        );

    }


    // ========================================================
    // FAILURE REASON SUMMARY
    // ========================================================

    const failureReasonCounts =
        new Map();


    result.failedTasks.forEach(
        item => {

            const reason =
                item?.reason ||
                "Unknown failure";


            failureReasonCounts.set(
                reason,
                (
                    failureReasonCounts.get(
                        reason
                    ) ||
                    0
                ) + 1
            );

        }
    );


    console.log(
        "======================================"
    );

    console.log(
        "STAGE 6F — FAILURE REASON SUMMARY"
    );

    console.log(
        "======================================"
    );


    console.table(
        [
            ...failureReasonCounts.entries()
        ]
        .map(
            (
                [
                    reason,
                    count
                ]
            ) => ({

                count,

                reason

            })
        )
        .sort(
            (
                a,
                b
            ) =>
                b.count -
                a.count
        )
    );


    // ============================================================
    // STAGE 6F — FAILED REQUIREMENT DIAGNOSTIC
    // ============================================================

    if (
        result.failedTasks.length > 0
    ) {

        const failedRequirementMap =
            new Map();


        result.failedTasks.forEach(
            item => {

                const task =
                    item?.task ||
                    item;


                if (
                    !task
                ) {

                    return;

                }


                const requirementId =
                    task.requirementId ??
                    task.requirement_id ??
                    null;


                if (
                    !requirementId
                ) {

                    return;

                }


                if (
                    !failedRequirementMap.has(
                        requirementId
                    )
                ) {

                    failedRequirementMap.set(
                        requirementId,
                        []
                    );

                }


                failedRequirementMap
                    .get(
                        requirementId
                    )
                    .push({

                        taskId:
                            task.taskId ??
                            task.task_id ??
                            task.id ??
                            null,

                        taskType:
                            task.taskType ??
                            task.task_type ??
                            task.type ??
                            null,

                        streamId:
                            task.streamId ??
                            task.stream_id ??
                            null,

                        subjectId:
                            task.subjectId ??
                            task.subject_id ??
                            null,

                        teacherId:
                            task.teacherId ??
                            task.teacher_id ??
                            null,

                        parallelGroup:
                            task.parallelGroup ??
                            task.parallel_group ??
                            null,

                        candidateCount:
                            item.candidateCount ??
                            null,

                        requiredDays:
                            item.requiredDays ??
                            null,

                        availableDays:
                            item.availableDays ??
                            null,

                        dayDeficit:
                            item.dayDeficit ??
                            null,

                        reason:
                            item?.reason ||
                            "Unknown"

                    });

            }
        );


        console.log(
            "======================================"
        );

        console.log(
            "STAGE 6F — FAILED REQUIREMENT DIAGNOSTIC"
        );

        console.log(
            "======================================"
        );


        console.table(
            [
                ...failedRequirementMap.entries()
            ]
            .map(
                (
                    [
                        requirementId,
                        tasks
                    ]
                ) => ({

                    requirementId,

                    failedTasks:
                        tasks.length,

                    taskIds:
                        tasks
                            .map(
                                task =>
                                    task.taskId
                            )
                            .join(
                                ", "
                            ),

                    taskTypes:
                        tasks
                            .map(
                                task =>
                                    task.taskType
                            )
                            .join(
                                ", "
                            ),

                    streams:
                        tasks
                            .map(
                                task =>
                                    task.streamId
                            )
                            .join(
                                ", "
                            ),

                    subjects:
                        tasks
                            .map(
                                task =>
                                    task.subjectId
                            )
                            .join(
                                ", "
                            ),

                    teachers:
                        tasks
                            .map(
                                task =>
                                    task.teacherId
                            )
                            .join(
                                ", "
                            ),

                    parallelGroups:
                        tasks
                            .map(
                                task =>
                                    task.parallelGroup
                            )
                            .filter(
                                value =>
                                    value
                            )
                            .join(
                                ", "
                            ),

                    reasons:
                        tasks
                            .map(
                                task =>
                                    task.reason
                            )
                            .join(
                                " | "
                            )

                })
            )
        );


        console.log(
            "======================================"
        );

    }


    // ============================================================
    // SUCCESS TABLE
    // ============================================================

    if (
        result.placedTasks.length > 0
    ) {

        console.table(
            result.placedTasks.map(
                item => ({

                    taskId:
                        item.task?.taskId ??
                        item.task?.task_id ??
                        null,

                    type:
                        item.task?.taskType ??
                        item.task?.task_type ??
                        null,

                    requirementId:
                        item.task?.requirementId ??
                        item.task?.requirement_id ??
                        null,

                    parallelGroup:
                        item.task?.parallelGroup ??
                        item.task?.parallel_group ??
                        null,

                    periods:
                        item.task?.periodIds?.join(
                            ", "
                        ) ||
                        "",

                    room:
                        item.task?.roomId ??
                        null,

                    score:
                        item.candidate?.score ??
                        null

                })
            )
        );

    }


    // ============================================================
    // RETURN COMPLETE RESULT
    // ============================================================

    return {

        ...result,

        indexes

    };

}

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


        if (
            !generatorData
        ) {

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
        // PRESERVE OCCUPANCY INDEXES FOR STAGE 7
        // ====================================================

        if (
            result.indexes
        ) {

            generatorData.indexes =
                result.indexes;

        }


        // ====================================================
        // STAGE 7 — REPAIR / BACKTRACKING
        // ====================================================

        setTimetableGenerationStatus(
            "Repairing unplaced timetable lessons...",
            "info"
        );


        const failedTasks =
            Array.isArray(
                result.failedTasks
            )
                ? result.failedTasks
                    .map(
                        item =>
                            item?.task ||
                            item
                    )
                    .filter(
                        Boolean
                    )
                : [];


        // ====================================================
        // IMPORTANT:
        //
        // result.placedTasks contains WRAPPER OBJECTS:
        //
        // {
        //     task,
        //     entries,
        //     candidate
        // }
        //
        // Stage 7 needs the ACTUAL TASK OBJECTS.
        //
        // Therefore extract:
        //
        //     item.task
        //
        // before passing them to runStage7Repair().
        // ====================================================

        const placedTasksForStage7 =
            Array.isArray(
                result.placedTasks
            )
                ? result.placedTasks
                    .map(
                        item =>
                            item?.task ||
                            item
                    )
                    .filter(
                        Boolean
                    )
                : [];


        console.log(
            "STAGE 7 TASK HANDOFF:",
            {

                failedTasks:
                    failedTasks.length,

                placedTasks:
                    placedTasksForStage7.length

            }
        );


        const repairResult =
            runStage7Repair(
                failedTasks,
                placedTasksForStage7,
                generatorData
            );


        // ====================================================
        // PRESERVE STAGE 7 RESULT
        // ====================================================

        result.stage7 =
            repairResult;


        // ====================================================
        // REMOVE OLD ENTRIES FOR MOVED TASKS
        // ====================================================
        //
        // When Stage 7 moves an existing lesson, the original
        // Stage 6 entry must disappear from result.entries.
        //
        // Otherwise the lesson may exist BOTH:
        //
        //     old period
        //     new period
        //
        // which can produce duplicate/conflicting timetable
        // entries during the final audit.
        //
        // ====================================================

        if (
            repairResult &&
            Array.isArray(
                repairResult.moved
            ) &&
            repairResult.moved.length > 0
        ) {

            const movedKeys =
                new Set();


            repairResult.moved.forEach(
                move => {

                    const movedTask =
                        move?.task;


                    const oldPeriod =
                        move?.from?.period;


                    if (
                        !movedTask ||
                        !oldPeriod
                    ) {

                        return;

                    }


                    const taskId =
                        normalizeTimetableId(
                            movedTask.taskId ??
                            movedTask.task_id ??
                            movedTask.id
                        );


                    const periodId =
                        normalizeTimetableId(
                            oldPeriod.id
                        );


                    if (
                        taskId &&
                        periodId
                    ) {

                        movedKeys.add(
                            `${taskId}__${periodId}`
                        );

                    }

                }
            );


            if (
                movedKeys.size > 0
            ) {

                result.entries =
                    result.entries.filter(
                        entry => {

                            if (
                                !entry
                            ) {

                                return false;

                            }


                            const entryTaskId =
                                normalizeTimetableId(
                                    entry.task_id ??
                                    entry.taskId
                                );


                            const entryPeriodId =
                                normalizeTimetableId(
                                    entry.period_id ??
                                    entry.periodId
                                );


                            const key =
                                `${entryTaskId}__${entryPeriodId}`;


                            return !movedKeys.has(
                                key
                            );

                        }
                    );

            }

        }


        // ====================================================
        // MERGE REPAIRED ENTRIES
        // ====================================================

        if (
            repairResult &&
            Array.isArray(
                repairResult.entries
            ) &&
            repairResult.entries.length > 0
        ) {

            result.entries.push(
                ...repairResult.entries
            );

        }


        // ====================================================
        // UPDATE PLACED TASKS AFTER STAGE 7
        // ====================================================
        //
        // Stage 7 may:
        //
        // 1. Repair a previously failed task.
        // 2. Move an already placed task.
        //
        // Keep result.placedTasks synchronized so later
        // audit/reporting code sees the repaired task list.
        //
        // ====================================================

        if (
            Array.isArray(
                result.placedTasks
            ) &&
            repairResult &&
            Array.isArray(
                repairResult.repaired
            )
        ) {

            const existingPlacedTaskIds =
                new Set(
                    result.placedTasks
                        .map(
                            item =>
                                normalizeTimetableId(
                                    item?.task?.taskId ??
                                    item?.task?.task_id ??
                                    item?.task?.id ??
                                    item?.taskId ??
                                    item?.task_id ??
                                    item?.id
                                )
                        )
                        .filter(
                            Boolean
                        )
                );


            repairResult.repaired.forEach(
                repairedTask => {

                    if (
                        !repairedTask
                    ) {

                        return;

                    }


                    const repairedTaskId =
                        normalizeTimetableId(
                            repairedTask.taskId ??
                            repairedTask.task_id ??
                            repairedTask.id
                        );


                    if (
                        !repairedTaskId
                    ) {

                        return;

                    }


                    if (
                        !existingPlacedTaskIds.has(
                            repairedTaskId
                        )
                    ) {

                        result.placedTasks.push(
                            {
                                task:
                                    repairedTask,

                                entries:
                                    repairResult.entries
                                        .filter(
                                            entry =>
                                                normalizeTimetableId(
                                                    entry?.task_id ??
                                                    entry?.taskId
                                                ) ===
                                                repairedTaskId
                                        ),

                                candidate:
                                    null

                            }
                        );


                        existingPlacedTaskIds.add(
                            repairedTaskId
                        );

                    }

                }
            );

        }


        // ====================================================
        // REMOVE DUPLICATE GENERATED ENTRIES
        // ====================================================
        //
        // One task must not occupy the same period twice.
        //
        // Key:
        //
        //     task + period
        //
        // ====================================================

        const uniqueEntries =
            new Map();


        result.entries.forEach(
            entry => {

                if (
                    !entry
                ) {

                    return;

                }


                const taskId =
                    normalizeTimetableId(
                        entry.task_id ??
                        entry.taskId
                    );


                const periodId =
                    normalizeTimetableId(
                        entry.period_id ??
                        entry.periodId
                    );


                // ------------------------------------------------
                // If task ID exists, use task + period.
                // ------------------------------------------------

                if (
                    taskId &&
                    periodId
                ) {

                    const key =
                        `${taskId}__${periodId}`;


                    uniqueEntries.set(
                        key,
                        entry
                    );


                    return;

                }


                // ------------------------------------------------
                // Preserve entries that lack task ID rather than
                // accidentally dropping them.
                // ------------------------------------------------

                const fallbackKey =
                    `fallback__${uniqueEntries.size}`;


                uniqueEntries.set(
                    fallbackKey,
                    entry
                );

            }
        );


        result.entries =
            [
                ...uniqueEntries.values()
            ];


        // ====================================================
        // UPDATE FAILED TASKS
        // ====================================================

        result.failedTasks =
            repairResult &&
            Array.isArray(
                repairResult.stillFailed
            )
                ? repairResult.stillFailed
                : failedTasks;


        // ====================================================
        // UPDATE GENERATION STATISTICS
        // ====================================================

        if (
            result.statistics
        ) {

            result.statistics.failedTasks =
                result.failedTasks.length;


            result.statistics.placedTasks =
                (
                    result.statistics.placedTasks ||
                    0
                ) +
                (
                    repairResult?.repairedCount ||
                    0
                );


            // ------------------------------------------------
            // Every generated entry represents ONE occupied
            // teaching period.
            // ------------------------------------------------

            result.statistics.totalPeriodsPlaced =
                result.entries.length;

        }


        // ====================================================
        // STAGE 7 DEBUG
        // ====================================================

        console.log(
            "======================================"
        );

        console.log(
            "STAGE 7 REPAIR RESULT"
        );

        console.log(
            "======================================"
        );

        console.log(
            "Originally failed tasks:",
            failedTasks.length
        );

        console.log(
            "Repaired tasks:",
            repairResult?.repairedCount ||
            0
        );

        console.log(
            "Still failed tasks:",
            result.failedTasks.length
        );

        console.log(
            "Repair entries:",
            repairResult?.entries?.length ||
            0
        );

        console.log(
            "Moved lessons:",
            repairResult?.moved?.length ||
            0
        );

        console.log(
            "Final unique entries:",
            result.entries.length
        );

        console.log(
            "======================================"
        );


        // ====================================================
        // STAGE 6G — FINAL AUDIT
        // ====================================================

        setTimetableGenerationStatus(
            "Running final timetable audit...",
            "info"
        );


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
            !audit ||
            audit.valid !== true
        ) {

            console.error(
                "TIMETABLE GENERATION BLOCKED."
            );

            console.error(
                "Stage 6G audit failed."
            );

            console.error(
                "Audit errors:",
                audit?.errors ||
                []
            );


            showTimetableConflicts(
                audit?.errors ||
                [],
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
            result.statistics?.totalTasks ||
            0
        );

        console.log(
            "Placed tasks:",
            result.statistics?.placedTasks ||
            0
        );

        console.log(
            "Failed tasks:",
            result.statistics?.failedTasks ||
            0
        );

        console.log(
            "Periods placed:",
            result.statistics?.totalPeriodsPlaced ||
            0
        );

        console.log(
            "Generated entries:",
            result.entries.length
        );

        console.log(
            "======================================"
        );


        // ====================================================
        // SAVE GENERATED TIMETABLE
        // ====================================================

        setTimetableGenerationStatus(
            "Saving generated timetable...",
            "info"
        );


        const schoolId =
            timetableState.schoolId;


        // ====================================================
        // REMOVE PREVIOUS GENERATED ENTRIES
        // ====================================================

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


        // ====================================================
        // PREPARE DATABASE ENTRIES
        // ====================================================

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


        // ====================================================
        // VALIDATE BEFORE INSERT
        // ====================================================

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


        // ====================================================
        // INSERT GENERATED ENTRIES
        // ====================================================

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
        // UPDATE LOCAL STATE
        // ====================================================

        generatedTimetableEntries =
            entriesToSave;


        // ====================================================
        // LOAD DISPLAY DATA
        // ====================================================

        await loadTimetableFilters();

        await loadGeneratedTimetable();


        // ====================================================
        // SUMMARY
        // ====================================================

        const totalTasks =
            result.statistics?.totalTasks ||
            0;


        const generatedEntries =
            result.entries?.length ||
            0;


        const failedTasksCount =
            result.failedTasks?.length ||
            result.statistics?.failedTasks ||
            0;


        showTimetableSummary(
            totalTasks,
            generatedEntries,
            failedTasksCount
        );


        // ====================================================
        // CONFLICT DISPLAY
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
            "✅ TIMETABLE GENERATION COMPLETE"
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
//
// Accepts BOTH:
//
//     camelCase
//     snake_case
//
// This keeps Stage 6F and Stage 6G independent of whether
// generated entries are still in generator format or have
// already been converted to database format.
//
// ============================================================


// ============================================================
// NORMALIZE GENERATED ENTRY
// ============================================================
//
// Accepts BOTH:
//
//     camelCase
//     snake_case
//
// This keeps Stage 6F and Stage 6G independent of whether
// generated entries are still in generator format or have
// already been converted to database format.
//
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
                entry.schoolId ??
                entry.school_id
            ),

        periodId:
            normalizeTimetableId(
                entry.periodId ??
                entry.period_id
            ),

        streamId:
            normalizeTimetableId(
                entry.streamId ??
                entry.stream_id
            ),

        subjectId:
            normalizeTimetableId(
                entry.subjectId ??
                entry.subject_id
            ),

        teacherId:
            normalizeTimetableId(
                entry.teacherId ??
                entry.teacher_id
            ),

        roomId:
            normalizeTimetableId(
                entry.roomId ??
                entry.room_id
            ),

        requirementId:
            normalizeTimetableId(
                entry.requirementId ??
                entry.requirement_id
            ),

        taskId:
            normalizeTimetableId(
                entry.taskId ??
                entry.task_id
            ),

        parallelGroup:
            normalizeTimetableId(
                entry.parallelGroup ??
                entry.parallel_group
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


            // ====================================================
            // FIRST LESSON FOR THIS STREAM + PERIOD
            // ====================================================

            if (
                !occupied.has(
                    key
                )
            ) {

                occupied.set(
                    key,
                    [
                        {
                            index,

                            entry,

                            normalized

                        }
                    ]
                );

                return;

            }


            // ====================================================
            // EXISTING LESSONS IN THIS STREAM + PERIOD
            // ====================================================

            const existingLessons =
                occupied.get(
                    key
                );


            // ====================================================
            // CHECK WHETHER THIS LESSON CAN RUN IN PARALLEL
            // ====================================================
            //
            // Allowed only when:
            //
            // 1. Subjects are different
            // 2. Teachers are different
            // 3. Both have the SAME explicit parallel group
            //
            // Example:
            //
            //     Mathematics / Teacher A / GROUP-1
            //     English     / Teacher B / GROUP-1
            //
            // Same stream + same period is valid because the
            // stream is intentionally split for parallel teaching.
            //
            // ====================================================

            let parallelAllowed =
                true;


            for (
                const existingLesson
                of existingLessons
            ) {

                const existing =
                    existingLesson.normalized;


                const sameSubject =
                    Boolean(
                        normalized.subjectId &&
                        existing.subjectId &&
                        normalized.subjectId ===
                        existing.subjectId
                    );


                const sameTeacher =
                    Boolean(
                        normalized.teacherId &&
                        existing.teacherId &&
                        normalized.teacherId ===
                        existing.teacherId
                    );


                const sameParallelGroup =
                    Boolean(
                        normalized.parallelGroup &&
                        existing.parallelGroup &&
                        normalized.parallelGroup ===
                        existing.parallelGroup
                    );


                // ------------------------------------------------
                // A duplicate subject OR duplicate teacher is
                // NOT valid parallel teaching.
                // ------------------------------------------------

                if (
                    sameSubject ||
                    sameTeacher ||
                    !sameParallelGroup
                ) {

                    parallelAllowed =
                        false;

                    break;

                }

            }


            // ====================================================
            // VALID PARALLEL LESSON
            // ====================================================

            if (
                parallelAllowed
            ) {

                existingLessons.push({

                    index,

                    entry,

                    normalized

                });

                return;

            }


            // ====================================================
            // TRUE STREAM CONFLICT
            // ====================================================

            const firstLesson =
                existingLessons[0];


            addTimetableAuditError(
                audit,
                "streamConflicts",
                "Stream has more than one conflicting lesson in the same period.",
                {

                    streamId:
                        normalized.streamId,

                    periodId:
                        normalized.periodId,

                    firstEntryIndex:
                        firstLesson.index,

                    secondEntryIndex:
                        index,

                    firstEntry:
                        firstLesson.entry,

                    secondEntry:
                        entry

                }
            );


            // ------------------------------------------------
            // Keep the conflicting lesson in the occupancy
            // list so additional conflicts against it are
            // also detected.
            // ------------------------------------------------

            existingLessons.push({

                index,

                entry,

                normalized

            });

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
                !occupied.has(
                    key
                )
            ) {

                occupied.set(
                    key,
                    []
                );

            }


            const existingEntries =
                occupied.get(
                    key
                );


            // ------------------------------------------------
            // SAME TEACHER + SAME PERIOD
            //
            // Same subject is allowed because the teacher may
            // teach the same subject concurrently to multiple
            // streams/classes.
            //
            // Different subjects are a real teacher conflict.
            // ------------------------------------------------

            const conflictingEntry =
                existingEntries.find(
                    existing =>
                        existing.subjectId !==
                        normalized.subjectId
                );


            if (
                conflictingEntry
            ) {

                addTimetableAuditError(
                    audit,
                    "teacherConflicts",
                    "Teacher has different lessons in the same period.",
                    {
                        teacherId:
                            normalized.teacherId,

                        periodId:
                            normalized.periodId,

                        firstEntryIndex:
                            conflictingEntry.entryIndex,

                        secondEntryIndex:
                            index,

                        firstSubjectId:
                            conflictingEntry.subjectId,

                        secondSubjectId:
                            normalized.subjectId

                    }
                );

            }


            existingEntries.push({

                entryIndex:
                    index,

                subjectId:
                    normalized.subjectId

            });

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

// ============================================================
// AUDIT REQUIREMENT WEEKLY TOTALS
// ============================================================
//
// Each generated entry must carry the requirementId of the
// requirement that created its lesson task.
//
// Therefore Stage 6G does NOT attempt to reconstruct the
// requirement from:
//
//     stream + subject + teacher
//
// Instead:
//
//     generated entry → requirementId → requirement
//
// This prevents ambiguity when multiple requirements share
// the same stream, subject, and teacher.
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
    // COUNT GENERATED ENTRIES BY REQUIREMENT
    // ========================================================

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
            // REQUIREMENT ID MUST EXIST
            // ------------------------------------------------

            if (
                !normalized.requirementId
            ) {

                addTimetableAuditError(
                    audit,
                    "requirementTotals",
                    "Generated entry has no requirement ID.",
                    {
                        entryIndex:
                            index,

                        periodId:
                            normalized.periodId,

                        streamId:
                            normalized.streamId,

                        subjectId:
                            normalized.subjectId,

                        teacherId:
                            normalized.teacherId

                    }
                );


                return;

            }


            // ------------------------------------------------
            // REQUIREMENT MUST EXIST
            // ------------------------------------------------

            const requirement =
                (data.requirements || [])
                    .find(
                        item =>
                            normalizeTimetableId(
                                item?.requirementId
                            ) ===
                            normalized.requirementId
                    );


            if (
                !requirement
            ) {

                addTimetableAuditError(
                    audit,
                    "requirementTotals",
                    "Generated entry references a requirement that does not exist.",
                    {
                        entryIndex:
                            index,

                        requirementId:
                            normalized.requirementId

                    }
                );


                return;

            }


            // ------------------------------------------------
            // COUNT ENTRY
            // ------------------------------------------------

            counts.set(
                normalized.requirementId,
                (
                    counts.get(
                        normalized.requirementId
                    ) || 0
                ) + 1
            );

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
                        requirement?.requirementId
                    );


                if (
                    !requirementId
                ) {

                    addTimetableAuditError(
                        audit,
                        "requirementTotals",
                        "Timetable requirement has no requirement ID.",
                        {}
                    );


                    return;

                }


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



// ============================================================
// AUDIT DAILY REQUIREMENT LIMITS
// ============================================================
//
// Requirement daily limits count LESSONS, not timetable
// periods.
//
// Therefore:
//
//     single lesson = 1 lesson
//     double lesson = 1 lesson
//
// A double lesson creates TWO generated entries, but both
// entries share the same taskId.
//
// ============================================================

function auditDailyRequirementLimits(
    data,
    entries,
    audit,
    lookups
) {

    const counts =
        new Map();


    // ========================================================
    // TRACK TASKS ALREADY COUNTED
    // ========================================================

    const countedTasks =
        new Set();


    // ========================================================
    // COUNT GENERATED LESSONS BY REQUIREMENT + DAY
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


            // ------------------------------------------------
            // REQUIREMENT ID IS AUTHORITATIVE
            // ------------------------------------------------

            const requirementId =
                normalized.requirementId;


            if (
                !requirementId
            ) {

                addTimetableAuditError(
                    audit,
                    "dailyRequirementLimits",
                    "Generated entry has no requirement ID, so its daily requirement limit cannot be audited.",
                    {
                        periodId:
                            normalized.periodId,

                        streamId:
                            normalized.streamId,

                        subjectId:
                            normalized.subjectId,

                        teacherId:
                            normalized.teacherId

                    }
                );


                return;

            }


            // ------------------------------------------------
            // LOOK UP PERIOD
            // ------------------------------------------------

            const period =
                lookups.periods.get(
                    normalized.periodId
                );


            if (
                !period
            ) {

                return;

            }


            // ------------------------------------------------
            // LOOK UP REQUIREMENT
            // ------------------------------------------------

            const requirement =
                lookups.requirements.get(
                    requirementId
                );


            if (
                !requirement
            ) {

                addTimetableAuditError(
                    audit,
                    "dailyRequirementLimits",
                    "Generated entry references a requirement that does not exist.",
                    {
                        requirementId,

                        periodId:
                            normalized.periodId

                    }
                );


                return;

            }


            // ------------------------------------------------
            // DAY NUMBER
            // ------------------------------------------------

            const dayNumber =
                Number(
                    period.dayNumber
                );


            // ------------------------------------------------
            // DOUBLE LESSON HANDLING
            // ------------------------------------------------
            //
            // Both entries of a double lesson have the same
            // taskId.
            //
            // Count that task only once for the requirement/day.
            //
            // ------------------------------------------------

            if (
                normalized.taskId
            ) {

                const taskKey =
                    [
                        normalized.taskId,
                        requirementId,
                        dayNumber
                    ]
                    .join(
                        "__"
                    );


                if (
                    countedTasks.has(
                        taskKey
                    )
                ) {

                    return;

                }


                countedTasks.add(
                    taskKey
                );

            }


            // ------------------------------------------------
            // REQUIREMENT + DAY KEY
            // ------------------------------------------------

            const key =
                `${requirementId}__${dayNumber}`;


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


    // ========================================================
    // COMPARE ACTUAL VS MAXIMUM DAILY LIMIT
    // ========================================================

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


            // ------------------------------------------------
            // 0 = NO DAILY LIMIT
            // ------------------------------------------------

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

    // ========================================================
    // COUNT UNIQUE TEACHER SESSIONS
    // ========================================================
    //
    // IMPORTANT:
    //
    // A teacher may legitimately appear in multiple streams
    // during the same period when teaching the same subject
    // concurrently.
    //
    // Therefore we must NOT count raw timetable entries.
    //
    // One teacher session is identified by:
    //
    //     teacher + period + subject
    //
    // Multiple streams/classes using that same session count
    // as ONE teacher lesson.
    //
    // ========================================================

    const sessions =
        new Map();


    entries.forEach(
        entry => {

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


            const period =
                lookups.periods.get(
                    normalized.periodId
                );


            if (
                !period
            ) {

                return;

            }


            const subjectId =
                normalized.subjectId ||
                "NO_SUBJECT";


            const sessionKey =
                `${normalized.teacherId}__` +
                `${normalized.periodId}__` +
                `${subjectId}`;


            if (
                !sessions.has(
                    sessionKey
                )
            ) {

                sessions.set(
                    sessionKey,
                    {
                        teacherId:
                            normalized.teacherId,

                        periodId:
                            normalized.periodId,

                        dayNumber:
                            Number(
                                period.dayNumber ??
                                period.day_number
                            ),

                        subjectId
                    }
                );

            }

        }
    );


    // ========================================================
    // COUNT UNIQUE SESSIONS PER TEACHER / DAY
    // ========================================================

    const counts =
        new Map();


    sessions.forEach(
        session => {

            if (
                !session ||
                !session.teacherId ||
                !Number.isFinite(
                    session.dayNumber
                )
            ) {

                return;

            }


            const key =
                `${session.teacherId}__${session.dayNumber}`;


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


    // ========================================================
    // CHECK LIMITS
    // ========================================================

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
                    teacher.maxLessonsPerDay ??
                    teacher.max_lessons_per_day
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

    // ========================================================
    // UNIQUE TEACHER SESSIONS
    // ========================================================
    //
    // Same teacher + same subject + same period across
    // multiple streams = ONE teacher session.
    //
    // ========================================================

    const sessions =
        new Set();


    entries.forEach(
        entry => {

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


            const subjectId =
                normalized.subjectId ||
                "NO_SUBJECT";


            const sessionKey =
                `${normalized.teacherId}__` +
                `${normalized.periodId}__` +
                `${subjectId}`;


            sessions.add(
                sessionKey
            );

        }
    );


    // ========================================================
    // COUNT UNIQUE SESSIONS PER TEACHER
    // ========================================================

    const counts =
        new Map();


    sessions.forEach(
        sessionKey => {

            const parts =
                sessionKey.split(
                    "__"
                );


            const teacherId =
                parts[0];


            if (
                !teacherId
            ) {

                return;

            }


            counts.set(
                teacherId,
                (
                    counts.get(
                        teacherId
                    ) || 0
                ) + 1
            );

        }
    );


    // ========================================================
    // CHECK WEEKLY LIMIT
    // ========================================================

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
                    teacher.maxLessonsPerWeek ??
                    teacher.max_lessons_per_week
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
// to the same task and requirement, using the same
// teacher/stream/subject/room and consecutive teaching periods.
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
    // BUILD MASTER ENTRY SET
    // ========================================================

    const masterEntryKeys =
        new Set();


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


            const key =
                [
                    normalized.taskId || "",
                    normalized.requirementId || "",
                    normalized.periodId,
                    normalized.streamId,
                    normalized.subjectId,
                    normalized.teacherId || "",
                    normalized.roomId || ""
                ]
                .join(
                    "__"
                );


            masterEntryKeys.add(
                key
            );

        }
    );


    // ========================================================
    // AUDIT EACH PLACED DOUBLE TASK
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


            const taskId =
                normalizeTimetableId(
                    task.taskId ??
                    task.id
                );


            const expectedRequirementId =
                normalizeTimetableId(
                    task.requirementId
                );


            const taskEntries =
                Array.isArray(
                    placement.entries
                )
                    ? placement.entries
                    : [];


            // ------------------------------------------------
            // MUST HAVE EXACTLY TWO ENTRIES
            // ------------------------------------------------

            if (
                taskEntries.length !== 2
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Double lesson does not contain exactly two generated entries.",
                    {
                        taskId,
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
                        taskId
                    }
                );


                return;

            }


            // ------------------------------------------------
            // TASK ID
            // ------------------------------------------------

            if (
                taskId
            ) {

                if (
                    first.taskId !== taskId
                ) {

                    addTimetableAuditError(
                        audit,
                        "doubleLessons",
                        "First double-lesson entry has an incorrect task ID.",
                        {
                            taskId,

                            firstTaskId:
                                first.taskId

                        }
                    );

                }


                if (
                    second.taskId !== taskId
                ) {

                    addTimetableAuditError(
                        audit,
                        "doubleLessons",
                        "Second double-lesson entry has an incorrect task ID.",
                        {
                            taskId,

                            secondTaskId:
                                second.taskId

                        }
                    );

                }

            }


            // ------------------------------------------------
            // REQUIREMENT MUST MATCH ORIGINAL TASK
            // ------------------------------------------------

            if (
                expectedRequirementId
            ) {

                if (
                    first.requirementId !==
                    expectedRequirementId
                ) {

                    addTimetableAuditError(
                        audit,
                        "doubleLessons",
                        "First double-lesson entry has an incorrect requirement ID.",
                        {
                            taskId,

                            expectedRequirementId,

                            firstRequirementId:
                                first.requirementId

                        }
                    );

                }


                if (
                    second.requirementId !==
                    expectedRequirementId
                ) {

                    addTimetableAuditError(
                        audit,
                        "doubleLessons",
                        "Second double-lesson entry has an incorrect requirement ID.",
                        {
                            taskId,

                            expectedRequirementId,

                            secondRequirementId:
                                second.requirementId

                        }
                    );

                }

            }


            // ------------------------------------------------
            // BOTH ENTRIES MUST EXIST IN MASTER RESULT
            // ------------------------------------------------

            const firstKey =
                [
                    first.taskId || "",
                    first.requirementId || "",
                    first.periodId,
                    first.streamId,
                    first.subjectId,
                    first.teacherId || "",
                    first.roomId || ""
                ]
                .join(
                    "__"
                );


            const secondKey =
                [
                    second.taskId || "",
                    second.requirementId || "",
                    second.periodId,
                    second.streamId,
                    second.subjectId,
                    second.teacherId || "",
                    second.roomId || ""
                ]
                .join(
                    "__"
                );


            if (
                !masterEntryKeys.has(
                    firstKey
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "First double-lesson entry is not present in the master generated entry list.",
                    {
                        taskId,

                        periodId:
                            first.periodId
                    }
                );

            }


            if (
                !masterEntryKeys.has(
                    secondKey
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Second double-lesson entry is not present in the master generated entry list.",
                    {
                        taskId,

                        periodId:
                            second.periodId
                    }
                );

            }


            // ------------------------------------------------
            // PERIOD REFERENCES
            // ------------------------------------------------

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
                        taskId,

                        firstPeriodId:
                            first.periodId,

                        secondPeriodId:
                            second.periodId

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
                        taskId,

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
                        taskId,

                        firstPeriodId:
                            first.periodId,

                        secondPeriodId:
                            second.periodId

                    }
                );

            }


            // ------------------------------------------------
            // SAME REQUIREMENT
            // ------------------------------------------------

            if (
                first.requirementId !==
                second.requirementId
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Double lesson changes requirement between its two periods.",
                    {
                        taskId,

                        firstRequirementId:
                            first.requirementId,

                        secondRequirementId:
                            second.requirementId

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
                        taskId,

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
                        taskId,

                        firstStreamId:
                            first.streamId,

                        secondStreamId:
                            second.streamId

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
                        taskId,

                        firstSubjectId:
                            first.subjectId,

                        secondSubjectId:
                            second.subjectId

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
                        taskId,

                        firstTeacherId:
                            first.teacherId,

                        secondTeacherId:
                            second.teacherId

                    }
                );

            }

        }
    );

}



// ============================================================
// AUDIT ROOM TYPE REQUIREMENTS
// ============================================================

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
            // REQUIREMENT ID IS AUTHORITATIVE
            // ------------------------------------------------

            const requirementId =
                normalized.requirementId;


            if (
                !requirementId
            ) {

                addTimetableAuditError(
                    audit,
                    "roomTypes",
                    "Generated entry has no requirement ID, so its room requirement cannot be audited.",
                    {
                        entryIndex:
                            index,

                        streamId:
                            normalized.streamId,

                        subjectId:
                            normalized.subjectId,

                        teacherId:
                            normalized.teacherId
                    }
                );


                return;

            }


            // ------------------------------------------------
            // LOOK UP REQUIREMENT
            // ------------------------------------------------

            const requirement =
                lookups.requirements.get(
                    requirementId
                );


            if (
                !requirement
            ) {

                addTimetableAuditError(
                    audit,
                    "roomTypes",
                    "Generated entry references a requirement that does not exist.",
                    {
                        entryIndex:
                            index,

                        requirementId
                    }
                );


                return;

            }


            // ------------------------------------------------
            // NO ROOM REQUIRED
            // ------------------------------------------------

            if (
                requirement.requiresRoom !== true
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

                        requirementId
                    }
                );


                return;

            }


            // ------------------------------------------------
            // LOOK UP ROOM
            // ------------------------------------------------

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

                        requirementId,

                        roomId:
                            normalized.roomId
                    }
                );


                return;

            }


            // ------------------------------------------------
            // AUTHORITATIVE ROOM TYPE ID
            // ------------------------------------------------
            //
            // Requirements use:
            //
            //     requirement.roomTypeId
            //
            // Rooms use:
            //
            //     room.room_type_id
            //
            // These UUIDs are the authoritative relationship.
            //
            // Legacy room_type text is retained only as a
            // fallback for older data.
            // ------------------------------------------------

            const expectedRoomTypeId =
                requirement.roomTypeId
                    ? normalizeTimetableId(
                        requirement.roomTypeId
                    )
                    : null;


            const actualRoomTypeId =
                room.room_type_id
                    ? normalizeTimetableId(
                        room.room_type_id
                    )
                    : null;


            // ------------------------------------------------
            // PRIMARY CHECK — ROOM TYPE ID
            // ------------------------------------------------

            if (
                expectedRoomTypeId
            ) {

                if (
                    actualRoomTypeId !==
                    expectedRoomTypeId
                ) {

                    addTimetableAuditError(
                        audit,
                        "roomTypes",
                        "Generated room does not match the requirement room type.",
                        {
                            entryIndex:
                                index,

                            requirementId,

                            expectedRoomTypeId,

                            actualRoomTypeId,

                            roomId:
                                normalized.roomId
                        }
                    );

                }

            }
            else {

                // ------------------------------------------------
                // LEGACY FALLBACK — ROOM TYPE TEXT
                // ------------------------------------------------

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

                            requirementId,

                            expectedType,

                            actualType,

                            roomId:
                                normalized.roomId
                        }
                    );

                }

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

                        requirementId,

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


            // ------------------------------------------------
            // REQUIREMENT
            // ------------------------------------------------

            if (
                !normalized.requirementId ||
                !lookups.requirements.has(
                    normalized.requirementId
                )
            ) {

                addTimetableAuditError(
                    audit,
                    "periodReferences",
                    "Generated entry references an invalid or missing requirement.",
                    {
                        entryIndex:
                            index,

                        requirementId:
                            normalized.requirementId

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

                            requirementId:
    normalized.requirementId ||
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


    // ========================================================
    // VALIDATE FAILED TASKS
    // ========================================================

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

            entries:
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


    // ========================================================
    // VALIDATE GENERATOR DATA
    // ========================================================

    if (
        !generatorData
    ) {

        console.error(
            "STAGE 7: generatorData missing."
        );

        return {

            repaired:
                [],

            entries:
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


    // ========================================================
    // GET OCCUPANCY INDEXES
    // ========================================================

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

            entries:
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


    // ========================================================
    // IMPORTANT:
    //
    // STAGE 7 RELOCATION NEEDS THE ACTUAL STAGE 6
    // PLACED-TASK LIST.
    // ========================================================

    generatorData.placedTasks =
        Array.isArray(
            placedTasks
        )
            ? [...placedTasks]
            : [];


    console.log(
        "STAGE 7: Failed tasks:",
        failedTasks.length
    );

    console.log(
        "STAGE 7: Existing placed tasks available for relocation:",
        generatorData.placedTasks.length
    );


    // ========================================================
    // RESULT COLLECTIONS
    // ========================================================

    const repaired = [];

    const entries = [];

    const moved = [];


    // ========================================================
    // NORMALIZATION HELPER
    // ========================================================

    const getTaskId =
        task => {

            if (
                !task
            ) {

                return "";

            }

            return String(
                task.taskId ??
                task.task_id ??
                task.id ??
                ""
            ).trim();

        };


    // ========================================================
    // PARALLEL GROUP OCCURRENCE KEY
    //
    // Example:
    //
    // BIO/PHY::S1
    // BIO/PHY::S2
    // RE/GE/BS::S4
    //
    // Every synchronized occurrence is processed atomically.
    // ========================================================

    const getParallelGroupOccurrenceKey =
        task => {

            if (
                !task
            ) {

                return "";

            }


            const parallelGroup =
                getTaskParallelGroup(
                    task
                );


            if (
                !parallelGroup
            ) {

                return "";

            }


            const taskId =
                getTaskId(
                    task
                );


            let sequence =
                "";


            const match =
                taskId.match(
                    /(?:^|[-_])S(\d+)$/i
                );


            if (
                match
            ) {

                sequence =
                    `S${match[1]}`;

            }


            // ----------------------------------------------------
            // FALLBACK SEQUENCE FIELDS
            // ----------------------------------------------------

            if (
                !sequence
            ) {

                sequence =
                    String(
                        task.lessonIndex ??
                        task.lesson_index ??
                        task.sequence ??
                        task.sequenceIndex ??
                        task.sequence_index ??
                        ""
                    ).trim();


                if (
                    sequence
                ) {

                    sequence =
                        `S${sequence}`;

                }

            }


            // ----------------------------------------------------
            // PRIMARY OCCURRENCE KEY
            // ----------------------------------------------------

            if (
                sequence
            ) {

                return (
                    `${String(
                        parallelGroup
                    ).trim()}::${sequence}`
                );

            }


            // ----------------------------------------------------
            // FINAL FALLBACK
            // ----------------------------------------------------

            const requirementId =
                String(
                    task.requirementId ??
                    task.requirement_id ??
                    ""
                ).trim();


            const lessonId =
                String(
                    task.lessonId ??
                    task.lesson_id ??
                    ""
                ).trim();


            return (
                `${String(
                    parallelGroup
                ).trim()}::` +
                `${requirementId}::` +
                `${lessonId}`
            );

        };


    // ========================================================
    // WORKING COPY
    // ========================================================

    let remainingTasks =
        [...failedTasks];


    // ========================================================
    // REPAIR PASSES
    // ========================================================

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


        // ====================================================
        // PARALLEL GROUP STATUS
        //
        // Possible values:
        //
        // "repaired"
        // "failed"
        //
        // This is deliberately a Map rather than a Set.
        //
        // A Set cannot tell the difference between:
        //
        //     group was successfully repaired
        //
        // and:
        //
        //     group was attempted and failed.
        // ====================================================

        const parallelGroupStatus =
            new Map();


        // ====================================================
        // PROCESS EACH FAILED TASK
        // ====================================================

        for (
            const task of remainingTasks
        ) {

            const taskId =
                getTaskId(
                    task
                );


            const parallelGroup =
                getTaskParallelGroup(
                    task
                );


            console.log(
                "Attempting repair:",
                taskId
            );


            // =================================================
            // PARALLEL GROUP TASK
            // =================================================

            if (
                parallelGroup
            ) {

                const occurrenceKey =
                    getParallelGroupOccurrenceKey(
                        task
                    );


                const existingStatus =
                    parallelGroupStatus.get(
                        occurrenceKey
                    );


                // =================================================
                // ALREADY PROCESSED OCCURRENCE
                // =================================================

                if (
                    existingStatus
                ) {

                    // ------------------------------------------------
                    // IMPORTANT:
                    //
                    // If the group was already repaired, this task
                    // was repaired together with the group.
                    //
                    // DO NOT put it into nextFailed.
                    // ------------------------------------------------

                    if (
                        existingStatus ===
                        "repaired"
                    ) {

                        console.log(
                            "STAGE 7: Parallel-group occurrence already REPAIRED this pass:",
                            occurrenceKey
                        );

                        continue;

                    }


                    // ------------------------------------------------
                    // If the group was already attempted and failed,
                    // this task remains failed.
                    // ------------------------------------------------

                    if (
                        existingStatus ===
                        "failed"
                    ) {

                        console.log(
                            "STAGE 7: Parallel-group occurrence already FAILED this pass:",
                            occurrenceKey
                        );


                        if (
                            !nextFailed.includes(
                                task
                            )
                        ) {

                            nextFailed.push(
                                task
                            );

                        }


                        continue;

                    }

                }


                // =================================================
                // MARK OCCURRENCE AS BEING PROCESSED
                // =================================================

                // We don't use "processed" as a final state.
                // The state will be changed to either:
                //
                //     repaired
                //
                // or:
                //
                //     failed
                //
                // after the repair attempt.

                console.log(
                    "STAGE 7: Parallel-group task detected:",
                    {

                        taskId,

                        parallelGroup,

                        occurrence:
                            occurrenceKey

                    }
                );


                // =================================================
                // ATOMIC PARALLEL-GROUP REPAIR
                // =================================================

                let result;


                if (
                    typeof
                    repairParallelGroupFailedTask
                    ===
                    "function"
                ) {

                    result =
                        repairParallelGroupFailedTask(
                            task,
                            generatorData
                        );

                }
                else {

                    console.error(
                        "STAGE 7: repairParallelGroupFailedTask() is not available."
                    );


                    result = {

                        repaired:
                            false,

                        entries:
                            [],

                        moved:
                            [],

                        tasks:
                            [],

                        reason:
                            "Parallel-group repair engine is unavailable."

                    };

                }


                // =================================================
                // PARALLEL GROUP REPAIR SUCCESS
                // =================================================

                if (
                    result &&
                    result.repaired
                ) {

                    // ------------------------------------------------
                    // Mark this occurrence as SUCCESSFULLY REPAIRED.
                    //
                    // All duplicate members encountered later in this
                    // same pass will now be skipped rather than placed
                    // into nextFailed.
                    // ------------------------------------------------

                    parallelGroupStatus.set(
                        occurrenceKey,
                        "repaired"
                    );


                    // ------------------------------------------------
                    // The group repair function returns the COMPLETE
                    // synchronized occurrence.
                    // ------------------------------------------------

                    const repairedGroupTasks =
                        Array.isArray(
                            result.tasks
                        )
                            ? result.tasks
                            : [task];


                    const repairedGroupIds =
                        new Set(
                            repairedGroupTasks
                                .map(
                                    getTaskId
                                )
                                .filter(
                                    Boolean
                                )
                        );


                    // ------------------------------------------------
                    // Record every member of this occurrence that
                    // was actually in the failed queue.
                    //
                    // Already-placed members are NOT counted as
                    // newly repaired.
                    // ------------------------------------------------

                    for (
                        const failedGroupTask
                        of remainingTasks
                    ) {

                        const failedGroupId =
                            getTaskId(
                                failedGroupTask
                            );


                        if (
                            repairedGroupIds.has(
                                failedGroupId
                            )
                        ) {

                            if (
                                !repaired.includes(
                                    failedGroupTask
                                )
                            ) {

                                repaired.push(
                                    failedGroupTask
                                );

                            }

                        }

                    }


                    // ------------------------------------------------
                    // Add every successfully placed group member to
                    // the active placed-task list.
                    // ------------------------------------------------

                    for (
                        const groupTask
                        of repairedGroupTasks
                    ) {

                        const groupTaskId =
                            getTaskId(
                                groupTask
                            );


                        if (
                            !groupTaskId
                        ) {

                            continue;

                        }


                        const alreadyPlaced =
                            generatorData.placedTasks.some(
                                existing =>
                                    getTaskId(
                                        existing
                                    ) ===
                                    groupTaskId
                            );


                        if (
                            !alreadyPlaced
                        ) {

                            generatorData.placedTasks.push(
                                groupTask
                            );

                        }

                    }


                    // ------------------------------------------------
                    // Preserve generated entries.
                    // ------------------------------------------------

                    if (
                        Array.isArray(
                            result.entries
                        )
                    ) {

                        entries.push(
                            ...result.entries
                        );

                    }


                    // ------------------------------------------------
                    // Preserve moved lessons.
                    // ------------------------------------------------

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
                        "✅ STAGE 7 PARALLEL GROUP REPAIRED:",
                        {

                            parallelGroup,

                            occurrence:
                                occurrenceKey,

                            members:
                                repairedGroupTasks.length,

                            generatedEntries:
                                Array.isArray(
                                    result.entries
                                )
                                    ? result.entries.length
                                    : 0,

                            moved:
                                Array.isArray(
                                    result.moved
                                )
                                    ? result.moved.length
                                    : 0

                        }
                    );


                    // ------------------------------------------------
                    // VERY IMPORTANT:
                    //
                    // Do not add any members of this occurrence to
                    // nextFailed.
                    //
                    // Duplicate members encountered later in this
                    // same pass will see status = "repaired" and
                    // simply continue.
                    // ------------------------------------------------

                    continue;

                }


                // =================================================
                // PARALLEL GROUP REPAIR FAILED
                // =================================================

                parallelGroupStatus.set(
                    occurrenceKey,
                    "failed"
                );


                console.log(
                    "❌ STAGE 7 COULD NOT REPAIR GROUP:",
                    {

                        taskId,

                        parallelGroup,

                        occurrence:
                            occurrenceKey,

                        reason:
                            result?.reason ??
                            "Unknown parallel-group repair failure."

                    }
                );


                // ------------------------------------------------
                // The entire occurrence remains failed because
                // parallel groups are atomic.
                //
                // Do this only once for the first failed attempt.
                // Subsequent members will simply see status="failed".
                // ------------------------------------------------

                for (
                    const remainingTask
                    of remainingTasks
                ) {

                    const remainingGroup =
                        getTaskParallelGroup(
                            remainingTask
                        );


                    if (
                        !remainingGroup
                    ) {

                        continue;

                    }


                    const remainingOccurrence =
                        getParallelGroupOccurrenceKey(
                            remainingTask
                        );


                    if (
                        remainingOccurrence ===
                        occurrenceKey
                    ) {

                        if (
                            !nextFailed.includes(
                                remainingTask
                            )
                        ) {

                            nextFailed.push(
                                remainingTask
                            );

                        }

                    }

                }


                continue;

            }


            // =================================================
            // NORMAL SINGLE-TASK REPAIR
            // =================================================

            const result =
                repairSingleFailedTask(
                    task,
                    generatorData
                );


            // =================================================
            // SINGLE TASK SUCCESS
            // =================================================

            if (
                result &&
                result.repaired
            ) {

                if (
                    !repaired.includes(
                        task
                    )
                ) {

                    repaired.push(
                        task
                    );

                }


                // ------------------------------------------------
                // Add newly repaired task to active placed list.
                // ------------------------------------------------

                const alreadyPlaced =
                    generatorData.placedTasks.some(
                        existing =>
                            getTaskId(
                                existing
                            ) ===
                            taskId
                    );


                if (
                    !alreadyPlaced
                ) {

                    generatorData.placedTasks.push(
                        task
                    );

                }


                // ------------------------------------------------
                // Preserve generated entries.
                // ------------------------------------------------

                if (
                    Array.isArray(
                        result.entries
                    )
                ) {

                    entries.push(
                        ...result.entries
                    );

                }


                // ------------------------------------------------
                // Preserve moved lessons.
                // ------------------------------------------------

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
                    taskId
                );

            }
            else {

                // ------------------------------------------------
                // SINGLE TASK STILL FAILED
                // ------------------------------------------------

                nextFailed.push(
                    task
                );


                console.log(
                    "❌ STAGE 7 COULD NOT REPAIR:",
                    taskId
                );

            }

        }


        // ====================================================
        // PREPARE NEXT PASS
        // ====================================================

        remainingTasks =
            nextFailed;


        console.log(
            `STAGE 7 PASS ${pass}:`,
            {

                repaired:
                    repaired.length,

                entries:
                    entries.length,

                remaining:
                    remainingTasks.length,

                moved:
                    moved.length

            }
        );


        // ====================================================
        // ALL REPAIRED
        // ====================================================

        if (
            remainingTasks.length === 0
        ) {

            console.log(
                `STAGE 7: All failed tasks repaired during pass ${pass}.`
            );

            break;

        }

    }


    // ========================================================
    // FINAL STILL-FAILED TASKS
    // ========================================================

    const stillFailed =
        [...remainingTasks];


    // ========================================================
    // FINAL REPORT
    // ========================================================

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
        "Generated repair entries:",
        entries.length
    );

    console.log(
        "Moved:",
        moved.length
    );

    console.log(
        "Still failed:",
        stillFailed.length
    );


    // ========================================================
    // REPAIR BREAKDOWN
    // ========================================================

    const repairedParallelGroupTasks =
        repaired.filter(
            task =>
                !!getTaskParallelGroup(
                    task
                )
        ).length;


    const repairedSingleTasks =
        repaired.length -
        repairedParallelGroupTasks;


    console.log(
        "STAGE 7 REPAIR BREAKDOWN:",
        {

            totalRepaired:
                repaired.length,

            parallelGroupTasks:
                repairedParallelGroupTasks,

            singleTasks:
                repairedSingleTasks,

            moved:
                moved.length,

            remaining:
                stillFailed.length

        }
    );


    // ========================================================
    // RETURN
    // ========================================================

    return {

        repaired,

        entries,

        stillFailed,

        moved,

        repairedCount:
            repaired.length,

        failedCount:
            stillFailed.length

    };

}


// ============================================================
// STAGE 7 — REPAIR PARALLEL GROUP FAILED TASK
// ============================================================
//
// PURPOSE:
//
// Repairs ONE failed occurrence of a parallel teaching group.
//
// IMPORTANT RULES:
//
// 1. All members of the parallel group occurrence must use
//    the SAME period.
//
// 2. Each member may use a different compatible room.
//
// 3. Parallel-group members are committed atomically.
//
// 4. Existing SINGLE lessons may be relocated when they block
//    a required synchronized period.
//
// 5. Existing PARALLEL-GROUP lessons are NEVER moved partially.
//
// 6. If anything fails, the complete original state is restored.
//
// 7. Doubles are NOT relocated by this function.
//
// 8. This function does NOT weaken checkSingleSlotConflict().
//
// ============================================================

function repairParallelGroupFailedTask(
    failedTask,
    generatorData,
    indexes
) {

    console.groupCollapsed(
        "STAGE 7 PARALLEL GROUP REPAIR"
    );

    // ========================================================
    // BASIC VALIDATION
    // ========================================================

    if (
        !failedTask ||
        !generatorData ||
        !indexes
    ) {

        console.warn(
            "STAGE 7 GROUP REPAIR: Invalid arguments."
        );

        console.groupEnd();

        return {
            repaired: false,
            entries: [],
            moved: [],
            reason: "Invalid repair arguments."
        };

    }


    // ========================================================
    // NORMALIZATION HELPERS
    // ========================================================

    const normalizeId = value =>
        normalizeTimetableId(value);


    const getTaskId = task =>
        normalizeId(
            task?.taskId ??
            task?.task_id ??
            task?.id
        );


    const getStreamId = task =>
        normalizeId(
            task?.streamId ??
            task?.stream_id
        );


    const getSubjectId = task =>
        normalizeId(
            task?.subjectId ??
            task?.subject_id
        );


    const getTeacherId = task =>
        normalizeId(
            task?.teacherId ??
            task?.teacher_id
        );


    const getRequirementId = task =>
        normalizeId(
            task?.requirementId ??
            task?.requirement_id
        );


    const getLessonId = task =>
        normalizeId(
            task?.lessonId ??
            task?.lesson_id
        );


    const getPeriodId = task =>
        normalizeId(
            task?.periodId ??
            task?.period_id
        );


    const getRoomId = task =>
        normalizeId(
            task?.roomId ??
            task?.room_id
        );


    const getParallelGroup = task =>
        normalizeId(
            task?.parallelGroup ??
            task?.parallel_group
        );


    const getStudentGroups = task => {

        if (
            typeof getTaskStudentGroups ===
            "function"
        ) {

            const groups =
                getTaskStudentGroups(task);

            if (
                Array.isArray(groups) &&
                groups.length > 0
            ) {

                return [
                    ...new Set(
                        groups
                            .map(normalizeId)
                            .filter(Boolean)
                    )
                ];

            }

        }


        if (
            typeof getStudentGroups ===
            "function"
        ) {

            const groups =
                getStudentGroups(task);

            if (
                Array.isArray(groups) &&
                groups.length > 0
            ) {

                return [
                    ...new Set(
                        groups
                            .map(normalizeId)
                            .filter(Boolean)
                    )
                ];

            }

        }


        const direct =
            task?.studentGroupIds ??
            task?.student_group_ids ??
            task?.studentGroups ??
            task?.student_groups;


        if (Array.isArray(direct)) {

            return [
                ...new Set(
                    direct
                        .map(normalizeId)
                        .filter(Boolean)
                )
            ];

        }


        if (direct) {

            const id =
                normalizeId(direct);

            return id
                ? [id]
                : [];

        }


        const streamId =
            getStreamId(task);

        return streamId
            ? [streamId]
            : [];

    };


    // ========================================================
    // GET OCCURRENCE / SEQUENCE NUMBER
    // ========================================================

    const getSequenceNumber = task => {

        const id =
            getTaskId(task);

        const lessonId =
            getLessonId(task);


        const sources = [
            id,
            lessonId
        ];


        for (
            const source
            of sources
        ) {

            if (!source) {
                continue;
            }


            const match =
                String(source).match(
                    /S(\d+)$/i
                );


            if (match) {

                return Number(
                    match[1]
                );

            }

        }


        if (
            Number.isFinite(
                Number(task?.lessonIndex)
            )
        ) {

            return Number(
                task.lessonIndex
            );

        }


        if (
            Number.isFinite(
                Number(task?.lesson_index)
            )
        ) {

            return Number(
                task.lesson_index
            );

        }


        if (
            Number.isFinite(
                Number(task?.occurrenceIndex)
            )
        ) {

            return Number(
                task.occurrenceIndex
            );

        }


        if (
            Number.isFinite(
                Number(task?.occurrence_index)
            )
        ) {

            return Number(
                task.occurrence_index
            );

        }


        if (
            Number.isFinite(
                Number(task?.sessionIndex)
            )
        ) {

            return Number(
                task.sessionIndex
            );

        }


        if (
            Number.isFinite(
                Number(task?.session_index)
            )
        ) {

            return Number(
                task.session_index
            );

        }


        return null;

    };


    // ========================================================
    // GROUP INFORMATION
    // ========================================================

    const parallelGroup =
        getParallelGroup(
            failedTask
        );


    if (!parallelGroup) {

        console.warn(
            "STAGE 7 GROUP REPAIR: Task has no parallel group.",
            failedTask
        );

        console.groupEnd();

        return {
            repaired: false,
            entries: [],
            moved: [],
            reason:
                "Task has no parallel group."
        };

    }


    const failedSequence =
        getSequenceNumber(
            failedTask
        );


    const occurrenceKey =
        failedSequence !== null
            ? `${parallelGroup}::S${failedSequence}`
            : `${parallelGroup}::UNKNOWN`;


    console.log(
        "STAGE 7 GROUP:",
        parallelGroup
    );

    console.log(
        "STAGE 7 GROUP OCCURRENCE:",
        failedSequence !== null
            ? `S${failedSequence}`
            : "UNKNOWN"
    );


    // ========================================================
    // COLLECT ALL TASKS
    // ========================================================

    const sourceArrays = [
        generatorData.lessonTasks,
        generatorData.tasks,
        generatorData.allTasks,
        generatorData.placedTasks
    ];


    const taskMap =
        new Map();


    for (
        const source
        of sourceArrays
    ) {

        if (
            !Array.isArray(source)
        ) {

            continue;

        }


        for (
            const task
            of source
        ) {

            if (!task) {
                continue;
            }


            const taskId =
                getTaskId(task);

            if (!taskId) {
                continue;
            }


            const taskGroup =
                getParallelGroup(task);

            if (
                taskGroup !==
                parallelGroup
            ) {

                continue;

            }


            const sequence =
                getSequenceNumber(task);


            // ------------------------------------------------
            // IMPORTANT:
            //
            // If we are repairing S5, ONLY S5 belongs here.
            //
            // A task with an unknown sequence is NOT allowed
            // to silently enter the S5 occurrence.
            // ------------------------------------------------

            if (
                failedSequence !== null &&
                sequence !== failedSequence
            ) {

                continue;

            }


            /*
             * Prefer an already-placed version because it contains
             * the current period and room.
             */
            const existing =
                taskMap.get(taskId);


            if (
                !existing
            ) {

                taskMap.set(
                    taskId,
                    task
                );

            } else {

                const existingPeriod =
                    getPeriodId(existing);

                const newPeriod =
                    getPeriodId(task);


                if (
                    !existingPeriod &&
                    newPeriod
                ) {

                    taskMap.set(
                        taskId,
                        task
                    );

                }

            }

        }

    }


    // Always include the failed task.
    taskMap.set(
        getTaskId(failedTask),
        failedTask
    );


    const groupTasks =
        [...taskMap.values()]
            .filter(Boolean)
            .filter(task => {

                if (
                    getParallelGroup(task) !==
                    parallelGroup
                ) {

                    return false;

                }


                if (
                    failedSequence === null
                ) {

                    return true;

                }


                return (
                    getSequenceNumber(task) ===
                    failedSequence
                );

            });


    if (
        groupTasks.length === 0
    ) {

        console.warn(
            "STAGE 7 GROUP REPAIR: No group members found."
        );

        console.groupEnd();

        return {
            repaired: false,
            entries: [],
            moved: [],
            reason:
                "No parallel group members found."
        };

    }


    console.log(
        "STAGE 7 GROUP MEMBERS:",
        groupTasks.map(
            task => getTaskId(task)
        )
    );


    // ========================================================
    // REQUIREMENT:
    //
    // WE MUST HAVE THE COMPLETE GROUP OCCURRENCE.
    // ========================================================

    const groupStreams =
        [
            ...new Set(
                groupTasks
                    .map(getStreamId)
                    .filter(Boolean)
            )
        ];


    const groupSubjects =
        [
            ...new Set(
                groupTasks
                    .map(getSubjectId)
                    .filter(Boolean)
            )
        ];


    if (
        groupTasks.length < 2
    ) {

        console.warn(
            "STAGE 7 GROUP REPAIR: Group contains fewer than 2 members."
        );

    }


    // ========================================================
    // SNAPSHOT ORIGINAL STATE
    // ========================================================

    const originalState =
        groupTasks.map(task => ({
            task,
            periodId:
                getPeriodId(task),
            roomId:
                getRoomId(task),
            streamId:
                getStreamId(task),
            subjectId:
                getSubjectId(task),
            teacherId:
                getTeacherId(task),
            requirementId:
                getRequirementId(task),
            lessonId:
                getLessonId(task)
        }));


    console.log(
        "STAGE 7 GROUP: Existing placements:",
        originalState.filter(
            item => item.periodId
        )
    );


    // ========================================================
    // GENERIC SNAPSHOT OF PLACED TASK STATE
    // ========================================================

    const placedTasksSnapshot =
        Array.isArray(
            generatorData.placedTasks
        )
            ? [
                ...generatorData.placedTasks
            ]
            : [];


    // ========================================================
    // RELEASE GROUP OCCURRENCE
    // ========================================================

    let releasedCount = 0;


    for (
        const item
        of originalState
    ) {

        if (
            !item.periodId
        ) {

            continue;

        }


        const period =
            (
                generatorData.periods ||
                []
            ).find(
                p =>
                    normalizeId(p?.id) ===
                    item.periodId
            );


        if (!period) {
            continue;
        }


        const room =
            (
                generatorData.rooms ||
                []
            ).find(
                r =>
                    normalizeId(r?.id) ===
                    item.roomId
            ) || null;


        const released =
            releaseReservedSlot(
                item.task,
                period,
                room,
                indexes
            );


        if (released) {

            releasedCount++;

        }

    }


    console.log(
        "STAGE 7 GROUP: Released existing members:",
        releasedCount
    );


    // ========================================================
    // CLEAR GROUP PLACEMENTS
    // ========================================================

    for (
        const task
        of groupTasks
    ) {

        task.periodId =
            null;

        task.period_id =
            null;

        task.roomId =
            null;

        task.room_id =
            null;

        task.placed =
            false;

    }


    // ========================================================
    // REMOVE GROUP ENTRIES FROM placedTasks
    // ========================================================

    if (
        Array.isArray(
            generatorData.placedTasks
        )
    ) {

        const groupTaskIds =
            new Set(
                groupTasks
                    .map(getTaskId)
                    .filter(Boolean)
            );


        generatorData.placedTasks =
            generatorData.placedTasks.filter(
                entry => {

                    const entryTaskId =
                        getTaskId(entry);

                    return !groupTaskIds.has(
                        entryTaskId
                    );

                }
            );

    }


    // ========================================================
    // SAFE ROLLBACK
    // ========================================================

    const rollbackEverything = () => {

        console.warn(
            "STAGE 7 GROUP: ROLLING BACK COMPLETE REPAIR."
        );


        // ----------------------------------------------------
        // FIRST: release anything currently reserved by the
        // group or relocated blockers.
        // ----------------------------------------------------

        const currentPlaced =
            Array.isArray(
                generatorData.placedTasks
            )
                ? [
                    ...generatorData.placedTasks
                ]
                : [];


        for (
            const entry
            of currentPlaced
        ) {

            const entryTaskId =
                getTaskId(entry);


            const isGroupTask =
                groupTasks.some(
                    task =>
                        getTaskId(task) ===
                        entryTaskId
                );


            if (isGroupTask) {

                const periodId =
                    getPeriodId(entry);

                const roomId =
                    getRoomId(entry);


                if (
                    periodId
                ) {

                    const period =
                        (
                            generatorData.periods ||
                            []
                        ).find(
                            p =>
                                normalizeId(p?.id) ===
                                periodId
                        );


                    const room =
                        (
                            generatorData.rooms ||
                            []
                        ).find(
                            r =>
                                normalizeId(r?.id) ===
                                roomId
                        ) || null;


                    if (period) {

                        releaseReservedSlot(
                            entry,
                            period,
                            room,
                            indexes
                        );

                    }

                }

            }

        }


        // ----------------------------------------------------
        // Restore placedTasks array exactly to the snapshot.
        // ----------------------------------------------------

        generatorData.placedTasks =
            [
                ...placedTasksSnapshot
            ];


        // ----------------------------------------------------
        // Restore group task object fields.
        // ----------------------------------------------------

        for (
            const original
            of originalState
        ) {

            const task =
                original.task;


            task.periodId =
                original.periodId;

            task.period_id =
                original.periodId;

            task.roomId =
                original.roomId;

            task.room_id =
                original.roomId;

            task.placed =
                Boolean(
                    original.periodId
                );

        }


        // ----------------------------------------------------
        // Rebuild indexes from the restored generated state
        // if the helper exists.
        // ----------------------------------------------------

        if (
            typeof createOccupancyIndexes ===
            "function"
        ) {

            try {

                const rebuilt =
                    createOccupancyIndexes(
                        generatorData
                    );


                if (
                    rebuilt
                ) {

                    Object.keys(
                        indexes
                    ).forEach(
                        key => {

                            if (
                                rebuilt[key] !==
                                undefined
                            ) {

                                indexes[key] =
                                    rebuilt[key];

                            }

                        }
                    );

                }

            } catch (
                rollbackIndexError
            ) {

                console.warn(
                    "STAGE 7 GROUP: Could not rebuild indexes during rollback:",
                    rollbackIndexError
                );

            }

        }

    };


    // ========================================================
    // BLOCKER DIAGNOSTICS
    // ========================================================

    const diagnosePeriod =
        (
            task,
            period
        ) => {

            const reasons =
                [];

            const blockers =
                [];

            const compatibleRooms =
                task.requiresRoom
                    ? getCompatibleRooms(
                        task,
                        generatorData.rooms
                    )
                    : [null];


            if (
                task.requiresRoom &&
                compatibleRooms.length === 0
            ) {

                return {
                    valid: false,
                    reasons: [
                        "No compatible room exists for this task."
                    ],
                    blockers: []
                };

            }


            for (
                const room
                of compatibleRooms
            ) {

                const result =
                    checkSingleSlotConflict(
                        task,
                        period,
                        room,
                        indexes
                    );


                if (
                    result &&
                    result.valid
                ) {

                    return {
                        valid: true,
                        reasons: [],
                        blockers: [],
                        room
                    };

                }


                if (
                    result?.reason
                ) {

                    reasons.push(
                        result.reason
                    );

                }


                // ------------------------------------------------
                // Identify actual placed-task blockers.
                // ------------------------------------------------

                const periodId =
                    normalizeId(
                        period?.id
                    );


                const roomId =
                    room
                        ? normalizeId(room?.id)
                        : null;


                const taskStudentGroups =
                    new Set(
                        getStudentGroups(task)
                    );


                const taskTeacherId =
                    getTeacherId(task);


                const placed =
                    Array.isArray(
                        generatorData.placedTasks
                    )
                        ? generatorData.placedTasks
                        : [];


                for (
                    const existing
                    of placed
                ) {

                    if (!existing) {
                        continue;
                    }


                    const existingTaskId =
                        getTaskId(existing);


                    const existingPeriodId =
                        getPeriodId(existing);


                    if (
                        !existingTaskId ||
                        existingTaskId ===
                        getTaskId(task)
                    ) {

                        continue;

                    }


                    if (
                        existingPeriodId !==
                        periodId
                    ) {

                        continue;

                    }


                    // --------------------------------------------
                    // Room blocker
                    // --------------------------------------------

                    if (
                        roomId &&
                        getRoomId(existing) ===
                        roomId
                    ) {

                        blockers.push({
                            taskId:
                                existingTaskId,
                            reason:
                                "ROOM",
                            grouped:
                                Boolean(
                                    getParallelGroup(existing)
                                )
                        });

                    }


                    // --------------------------------------------
                    // Teacher blocker
                    // --------------------------------------------

                    if (
                        taskTeacherId &&
                        getTeacherId(existing) ===
                        taskTeacherId
                    ) {

                        const allowed =
                            areConcurrentTeacherLessonsAllowed(
                                task,
                                existing
                            );


                        if (!allowed) {

                            blockers.push({
                                taskId:
                                    existingTaskId,
                                reason:
                                    "TEACHER",
                                grouped:
                                    Boolean(
                                        getParallelGroup(existing)
                                    )
                            });

                        }

                    }


                    // --------------------------------------------
                    // Student-group / stream blocker
                    // --------------------------------------------

                    const existingGroups =
                        getStudentGroups(
                            existing
                        );


                    const sharedGroup =
                        existingGroups.some(
                            id =>
                                taskStudentGroups.has(id)
                        );


                    if (
                        sharedGroup
                    ) {

                        const sameSubject =
                            getSubjectId(existing) ===
                            getSubjectId(task);


                        const sameParallelGroup =
                            Boolean(
                                getParallelGroup(task)
                            ) &&
                            Boolean(
                                getParallelGroup(existing)
                            ) &&
                            getParallelGroup(task) ===
                            getParallelGroup(existing);


                        const differentTeachers =
                            getTeacherId(existing) !==
                            getTeacherId(task);


                        const allowedParallel =
                            !sameSubject &&
                            differentTeachers &&
                            sameParallelGroup;


                        if (
                            !allowedParallel
                        ) {

                            blockers.push({
                                taskId:
                                    existingTaskId,
                                reason:
                                    "STUDENT_GROUP",
                                grouped:
                                    Boolean(
                                        getParallelGroup(existing)
                                    )
                            });

                        }

                    }

                }

            }


            return {
                valid: false,
                reasons: [
                    ...new Set(reasons)
                ],
                blockers: [
                    ...new Map(
                        blockers.map(
                            blocker => [
                                `${blocker.taskId}::${blocker.reason}`,
                                blocker
                            ]
                        )
                    ).values()
                ]
            };

        };


    // ========================================================
    // DIAGNOSE ALL MEMBERS / ALL PERIODS
    // ========================================================

    const teachingPeriods =
        getTeachingPeriods(
            generatorData.periods
        );


    const groupDiagnostics =
        [];


    for (
        const task
        of groupTasks
    ) {

        const taskDiagnostics =
            [];


        for (
            const period
            of teachingPeriods
        ) {

            const diagnosis =
                diagnosePeriod(
                    task,
                    period
                );


            if (
                !diagnosis.valid
            ) {

                taskDiagnostics.push({
                    periodId:
                        normalizeId(period?.id),
                    reasons:
                        diagnosis.reasons,
                    blockers:
                        diagnosis.blockers
                });

            }

        }


        groupDiagnostics.push({
            taskId:
                getTaskId(task),
            diagnostics:
                taskDiagnostics
        });

    }


    console.log(
        "STAGE 7 GROUP BLOCKER DIAGNOSIS:",
        groupDiagnostics
    );


    // ========================================================
    // BUILD COMMON PERIOD CANDIDATES
    // ========================================================
    //
    // IMPORTANT:
    //
    // A member having ZERO candidates is NOT an immediate
    // failure.
    //
    // It may simply mean an existing SINGLE lesson is blocking
    // all currently available periods.
    //
    // We therefore keep the empty candidate set and allow the
    // blocker-relocation engine below to run.
    //
    // ========================================================

    const candidateSets =
        [];


    let initialCandidateFailure =
        false;


    for (
        const task
        of groupTasks
    ) {

        const candidates =
            getScoredSingleLessonCandidates(
                task,
                generatorData,
                indexes
            );


        if (
            !Array.isArray(candidates) ||
            candidates.length === 0
        ) {

            initialCandidateFailure =
                true;


            console.warn(
                "STAGE 7 GROUP: Member currently has no candidates. Blocker relocation will be attempted:",
                getTaskId(task)
            );


            const diagnostics =
                groupDiagnostics.find(
                    item =>
                        item.taskId ===
                        getTaskId(task)
                );


            if (diagnostics) {

                console.warn(
                    "STAGE 7 GROUP BLOCKERS:",
                    diagnostics
                );

            }


            candidateSets.push({
                task,
                candidates: []
            });


            continue;

        }


        candidateSets.push({
            task,
            candidates
        });

    }


    console.log(
        "STAGE 7 GROUP: Initial candidate failure:",
        initialCandidateFailure
    );


    // ========================================================
    // COMMON PERIOD INTERSECTION
    // ========================================================

    const periodMaps =
        candidateSets.map(
            item => {

                const map =
                    new Map();


                for (
                    const candidate
                    of item.candidates
                ) {

                    const periodId =
                        normalizeId(
                            candidate?.period?.id
                        );


                    if (!periodId) {
                        continue;
                    }


                    if (
                        !map.has(periodId)
                    ) {

                        map.set(
                            periodId,
                            []
                        );

                    }


                    map.get(
                        periodId
                    ).push(candidate);

                }


                return map;

            }
        );


    let commonPeriodIds =
        periodMaps.length > 0
            ? [
                ...periodMaps[0].keys()
            ]
            : [];


    for (
        let i = 1;
        i < periodMaps.length;
        i++
    ) {

        commonPeriodIds =
            commonPeriodIds.filter(
                periodId =>
                    periodMaps[i].has(
                        periodId
                    )
            );

    }


    // ========================================================
    // IF NO COMMON PERIOD:
    // TRY SAFE SINGLE-LESSON RELOCATION.
    // ========================================================

    const movedBlockers =
        [];


    const movedTaskIds =
        new Set();


    const MAX_BLOCKER_RELOCATIONS =
        Math.max(
            1,
            Math.min(
                12,
                groupTasks.length * 4
            )
        );


    const getTaskFromPlaced =
        taskId => {

            const placed =
                Array.isArray(
                    generatorData.placedTasks
                )
                    ? generatorData.placedTasks
                    : [];


            return placed.find(
                entry =>
                    getTaskId(entry) ===
                    taskId
            ) || null;

        };


    // ========================================================
    // FIND ORIGINAL TASK DEFINITION
    //
    // Used when relocating blockers so that properties such as
    // requiresRoom, duration, parallelGroup, etc. are preserved.
    // ========================================================

    const getOriginalTaskDefinition =
        taskId => {

            const sources = [
                generatorData.lessonTasks,
                generatorData.tasks,
                generatorData.allTasks
            ];


            for (
                const source
                of sources
            ) {

                if (
                    !Array.isArray(source)
                ) {

                    continue;

                }


                const found =
                    source.find(
                        task =>
                            getTaskId(task) ===
                            taskId
                    );


                if (found) {

                    return found;

                }

            }


            return null;

        };


    const relocateSingleBlocker =
        blockerTaskId => {

            if (
                movedTaskIds.has(
                    blockerTaskId
                )
            ) {

                return false;

            }


            if (
                movedBlockers.length >=
                MAX_BLOCKER_RELOCATIONS
            ) {

                return false;

            }


            const placedBlocker =
                getTaskFromPlaced(
                    blockerTaskId
                );


            const blockerDefinition =
                getOriginalTaskDefinition(
                    blockerTaskId
                );


            if (
                !placedBlocker &&
                !blockerDefinition
            ) {

                return false;

            }


            // ------------------------------------------------
            // Use the original task definition when available,
            // but copy the CURRENT placement information from
            // the placed entry.
            // ------------------------------------------------

            const blocker =
                blockerDefinition
                    ? {
                        ...blockerDefinition,
                        ...placedBlocker
                    }
                    : placedBlocker;


            if (!blocker) {

                return false;

            }


            // ----------------------------------------------
            // NEVER move a parallel-group blocker here.
            // Moving it partially would split its group.
            // ----------------------------------------------

            const blockerGroup =
                getParallelGroup(
                    blocker
                );


            if (blockerGroup) {

                console.warn(
                    "STAGE 7 GROUP: Cannot safely relocate grouped blocker:",
                    blockerTaskId,
                    blockerGroup
                );

                return false;

            }


            // ----------------------------------------------
            // Doubles are not moved.
            // ----------------------------------------------

            if (
                blocker.isDouble ||
                blocker.is_double ||
                blocker.lessonType === "double" ||
                blocker.lesson_type === "double" ||
                blocker.duration === 2 ||
                blocker.periodCount === 2
            ) {

                console.warn(
                    "STAGE 7 GROUP: Cannot relocate double blocker:",
                    blockerTaskId
                );

                return false;

            }


            const oldPeriodId =
                getPeriodId(
                    blocker
                );


            const oldRoomId =
                getRoomId(
                    blocker
                );


            if (!oldPeriodId) {

                return false;

            }


            const oldPeriod =
                teachingPeriods.find(
                    period =>
                        normalizeId(period?.id) ===
                        oldPeriodId
                );


            if (!oldPeriod) {

                return false;

            }


            const oldRoom =
                (
                    generatorData.rooms ||
                    []
                ).find(
                    room =>
                        normalizeId(room?.id) ===
                        oldRoomId
                ) || null;


            console.log(
                "STAGE 7 GROUP: Attempting single blocker relocation:",
                blockerTaskId
            );


            // ----------------------------------------------
            // Release blocker.
            // ----------------------------------------------

            const released =
                releaseReservedSlot(
                    blocker,
                    oldPeriod,
                    oldRoom,
                    indexes
                );


            if (!released) {

                console.warn(
                    "STAGE 7 GROUP: Could not release blocker:",
                    blockerTaskId
                );

                return false;

            }


            // Remove blocker from placedTasks.
            generatorData.placedTasks =
                Array.isArray(
                    generatorData.placedTasks
                )
                    ? generatorData.placedTasks.filter(
                        entry =>
                            getTaskId(entry) !==
                            blockerTaskId
                    )
                    : [];


            blocker.periodId =
                null;

            blocker.period_id =
                null;

            blocker.roomId =
                null;

            blocker.room_id =
                null;

            blocker.placed =
                false;


            // ----------------------------------------------
            // Generate candidates AFTER release.
            // ----------------------------------------------

            const blockerCandidates =
                getScoredSingleLessonCandidates(
                    blocker,
                    generatorData,
                    indexes
                );


            let relocated =
                false;


            for (
                const candidate
                of blockerCandidates
            ) {

                if (
                    !candidate?.period
                ) {

                    continue;

                }


                const newPeriod =
                    candidate.period;

                const newRoom =
                    candidate.room ||
                    null;


                const validation =
                    checkSingleSlotConflict(
                        blocker,
                        newPeriod,
                        newRoom,
                        indexes
                    );


                if (
                    !validation ||
                    !validation.valid
                ) {

                    continue;

                }


                const reserved =
                    reserveSlot(
                        blocker,
                        newPeriod,
                        newRoom,
                        indexes
                    );


                if (!reserved) {

                    continue;

                }


                const newEntry =
                    createGeneratedEntry(
                        blocker,
                        newPeriod,
                        newRoom
                    );


                if (!newEntry) {

                    releaseReservedSlot(
                        blocker,
                        newPeriod,
                        newRoom,
                        indexes
                    );

                    continue;

                }


                generatorData.placedTasks.push(
                    newEntry
                );


                blocker.periodId =
                    normalizeId(
                        newPeriod.id
                    );

                blocker.period_id =
                    normalizeId(
                        newPeriod.id
                    );

                blocker.roomId =
                    newRoom
                        ? normalizeId(newRoom.id)
                        : null;

                blocker.room_id =
                    newRoom
                        ? normalizeId(newRoom.id)
                        : null;

                blocker.placed =
                    true;


                movedTaskIds.add(
                    blockerTaskId
                );


                movedBlockers.push({
                    taskId:
                        blockerTaskId,
                    fromPeriodId:
                        oldPeriodId,
                    fromRoomId:
                        oldRoomId,
                    toPeriodId:
                        normalizeId(
                            newPeriod.id
                        ),
                    toRoomId:
                        newRoom
                            ? normalizeId(newRoom.id)
                            : null,
                    entry:
                        newEntry
                });


                relocated =
                    true;


                console.log(
                    "STAGE 7 GROUP: SINGLE BLOCKER MOVED:",
                    movedBlockers[
                        movedBlockers.length - 1
                    ]
                );


                break;

            }


            if (!relocated) {

                // ------------------------------------------
                // Restore the blocker immediately.
                // ------------------------------------------

                const restored =
                    reserveSlot(
                        blocker,
                        oldPeriod,
                        oldRoom,
                        indexes
                    );


                if (restored) {

                    const oldEntry =
                        createGeneratedEntry(
                            blocker,
                            oldPeriod,
                            oldRoom
                        );


                    if (oldEntry) {

                        generatorData.placedTasks.push(
                            oldEntry
                        );

                    }


                    blocker.periodId =
                        oldPeriodId;

                    blocker.period_id =
                        oldPeriodId;

                    blocker.roomId =
                        oldRoomId;

                    blocker.room_id =
                        oldRoomId;

                    blocker.placed =
                        true;

                }


                console.warn(
                    "STAGE 7 GROUP: Single blocker could not be relocated:",
                    blockerTaskId
                );


                return false;

            }


            return true;

        };


    // ========================================================
    // REPEATEDLY TRY:
    //
    // 1. Rebuild candidates.
    // 2. Find common period.
    // 3. If none, inspect blockers.
    // 4. Move only a SINGLE blocker.
    // ========================================================

    let relocationPass =
        0;


    const MAX_RELOCATION_PASSES =
        MAX_BLOCKER_RELOCATIONS;


    while (
        commonPeriodIds.length === 0 &&
        relocationPass <
        MAX_RELOCATION_PASSES
    ) {

        relocationPass++;


        console.log(
            `STAGE 7 GROUP: Blocker relocation pass ${relocationPass}`
        );


        let blockerMoved =
            false;


        // ----------------------------------------------------
        // Re-run diagnostics using the current state.
        // ----------------------------------------------------

        for (
            const task
            of groupTasks
        ) {

            for (
                const period
                of teachingPeriods
            ) {

                const diagnosis =
                    diagnosePeriod(
                        task,
                        period
                    );


                if (
                    diagnosis.valid ||
                    diagnosis.blockers.length === 0
                ) {

                    continue;

                }


                for (
                    const blocker
                    of diagnosis.blockers
                ) {

                    if (
                        movedTaskIds.has(
                            blocker.taskId
                        )
                    ) {

                        continue;

                    }


                    if (
                        blocker.grouped
                    ) {

                        continue;

                    }


                    const moved =
                        relocateSingleBlocker(
                            blocker.taskId
                        );


                    if (moved) {

                        blockerMoved =
                            true;

                        break;

                    }

                }


                if (blockerMoved) {
                    break;
                }

            }


            if (blockerMoved) {
                break;
            }

        }


        if (!blockerMoved) {

            break;

        }


        // ----------------------------------------------------
        // Rebuild indexes after relocation.
        // ----------------------------------------------------

        if (
            typeof createOccupancyIndexes ===
            "function"
        ) {

            try {

                const rebuilt =
                    createOccupancyIndexes(
                        generatorData
                    );


                if (
                    rebuilt
                ) {

                    Object.keys(
                        indexes
                    ).forEach(
                        key => {

                            if (
                                rebuilt[key] !==
                                undefined
                            ) {

                                indexes[key] =
                                    rebuilt[key];

                            }

                        }
                    );

                }

            } catch (
                rebuildError
            ) {

                console.warn(
                    "STAGE 7 GROUP: Index rebuild failed after blocker relocation:",
                    rebuildError
                );

            }

        }


        // ----------------------------------------------------
        // Rebuild candidate sets.
        // ----------------------------------------------------

        candidateSets.length =
            0;


        for (
            const task
            of groupTasks
        ) {

            const candidates =
                getScoredSingleLessonCandidates(
                    task,
                    generatorData,
                    indexes
                );


            candidateSets.push({
                task,
                candidates
            });

        }


        // ----------------------------------------------------
        // Recalculate common periods.
        // ----------------------------------------------------

        periodMaps.length =
            0;


        for (
            const item
            of candidateSets
        ) {

            const map =
                new Map();


            for (
                const candidate
                of item.candidates
            ) {

                const periodId =
                    normalizeId(
                        candidate?.period?.id
                    );


                if (!periodId) {
                    continue;
                }


                if (
                    !map.has(periodId)
                ) {

                    map.set(
                        periodId,
                        []
                    );

                }


                map.get(
                    periodId
                ).push(candidate);

            }


            periodMaps.push(
                map
            );

        }


        commonPeriodIds =
            periodMaps.length > 0
                ? [
                    ...periodMaps[0].keys()
                ]
                : [];


        for (
            let i = 1;
            i < periodMaps.length;
            i++
        ) {

            commonPeriodIds =
                commonPeriodIds.filter(
                    periodId =>
                        periodMaps[i].has(
                            periodId
                        )
                );

        }


        console.log(
            "STAGE 7 GROUP: Common periods after relocation:",
            commonPeriodIds
        );

    }


    // ========================================================
    // STILL NO COMMON PERIOD
    // ========================================================

    if (
        commonPeriodIds.length === 0
    ) {

        console.warn(
            "STAGE 7 GROUP: No common period after safe single-lesson relocation."
        );


        rollbackEverything();

        console.groupEnd();

        return {
            repaired: false,
            entries: [],
            moved: [],
            reason:
                `No common synchronized period for parallel group ${parallelGroup}.`,
            occurrence:
                occurrenceKey,
            diagnostics:
                groupDiagnostics
        };

    }


    // ========================================================
    // SCORE COMMON PERIODS
    // ========================================================

    const commonCandidates =
        commonPeriodIds.map(
            periodId => {

                let totalScore =
                    0;


                const memberCandidates =
                    [];


                for (
                    let i = 0;
                    i < candidateSets.length;
                    i++
                ) {

                    const candidate =
                        (
                            periodMaps[i]
                                .get(periodId) ||
                            []
                        )[0];


                    if (!candidate) {

                        return null;

                    }


                    totalScore +=
                        Number(
                            candidate.score
                        ) || 0;


                    memberCandidates.push(
                        candidate
                    );

                }


                return {
                    periodId,
                    totalScore,
                    memberCandidates
                };

            }
        )
        .filter(Boolean)
        .sort(
            (a, b) =>
                b.totalScore -
                a.totalScore
        );


    // ========================================================
    // TRY COMMON PERIODS
    // ========================================================

    for (
        const common
        of commonCandidates
    ) {

        const periodId =
            common.periodId;


        const period =
            teachingPeriods.find(
                p =>
                    normalizeId(p?.id) ===
                    periodId
            );


        if (!period) {
            continue;
        }


        console.log(
            "STAGE 7 GROUP: Trying common period:",
            periodId
        );


        // ====================================================
        // ROOM BACKTRACKING
        // ====================================================

        const roomChoices =
            [];


        for (
            let i = 0;
            i < groupTasks.length;
            i++
        ) {

            const task =
                groupTasks[i];


            const compatibleRooms =
                task.requiresRoom
                    ? getCompatibleRooms(
                        task,
                        generatorData.rooms
                    )
                    : [null];


            if (
                task.requiresRoom &&
                compatibleRooms.length === 0
            ) {

                roomChoices.length =
                    0;

                break;

            }


            roomChoices.push({
                task,
                rooms:
                    compatibleRooms
            });

        }


        if (
            roomChoices.length !==
            groupTasks.length
        ) {

            continue;

        }


        // ----------------------------------------------------
        // Generate room combinations recursively.
        // ----------------------------------------------------

        const tryRoomAssignment =
            (
                index,
                assignment,
                usedRooms
            ) => {

                if (
                    index >=
                    roomChoices.length
                ) {

                    return {
                        ...assignment
                    };

                }


                const item =
                    roomChoices[index];


                for (
                    const room
                    of item.rooms
                ) {

                    const roomId =
                        room
                            ? normalizeId(room.id)
                            : null;


                    if (
                        roomId &&
                        usedRooms.has(
                            roomId
                        )
                    ) {

                        continue;

                    }


                    // ----------------------------------------
                    // Validate this member against CURRENT
                    // occupancy.
                    // ----------------------------------------

                    const validation =
                        checkSingleSlotConflict(
                            item.task,
                            period,
                            room,
                            indexes
                        );


                    if (
                        !validation ||
                        !validation.valid
                    ) {

                        continue;

                    }


                    if (roomId) {

                        usedRooms.add(
                            roomId
                        );

                    }


                    assignment[
                        getTaskId(
                            item.task
                        )
                    ] =
                        room;


                    const result =
                        tryRoomAssignment(
                            index + 1,
                            assignment,
                            usedRooms
                        );


                    if (result) {

                        return result;

                    }


                    delete assignment[
                        getTaskId(
                            item.task
                        )
                    ];


                    if (roomId) {

                        usedRooms.delete(
                            roomId
                        );

                    }

                }


                return null;

            };


        const roomAssignment =
            tryRoomAssignment(
                0,
                {},
                new Set()
            );


        if (!roomAssignment) {

            console.warn(
                "STAGE 7 GROUP: No valid room assignment for period:",
                periodId
            );

            continue;

        }


        // ====================================================
        // FINAL ATOMIC VALIDATION
        // ====================================================

        let finalValid =
            true;


        for (
            const task
            of groupTasks
        ) {

            const room =
                roomAssignment[
                    getTaskId(task)
                ] || null;


            const validation =
                checkSingleSlotConflict(
                    task,
                    period,
                    room,
                    indexes
                );


            if (
                !validation ||
                !validation.valid
            ) {

                finalValid =
                    false;

                console.warn(
                    "STAGE 7 GROUP: Final validation failed:",
                    {
                        taskId:
                            getTaskId(task),
                        periodId,
                        reason:
                            validation?.reason
                    }
                );

                break;

            }

        }


        if (!finalValid) {
            continue;
        }


        // ====================================================
        // ATOMIC COMMIT
        // ====================================================

        const committedEntries =
            [];


        let commitFailed =
            false;


        for (
            const task
            of groupTasks
        ) {

            const room =
                roomAssignment[
                    getTaskId(task)
                ] || null;


            const selection = {
                task,
                candidate: {
                    period,
                    room
                }
            };


            const result =
                placeSelectedSingleTask(
                    selection,
                    indexes
                );


            if (
                !result ||
                !result.placed
            ) {

                commitFailed =
                    true;

                console.error(
                    "STAGE 7 GROUP: Atomic commit failed:",
                    {
                        taskId:
                            getTaskId(task),
                        result
                    }
                );

                break;

            }


            if (
                Array.isArray(
                    result.entries
                )
            ) {

                committedEntries.push(
                    ...result.entries
                );

            }

        }


        // ====================================================
        // ROLLBACK PARTIAL COMMIT
        // ====================================================

        if (commitFailed) {

            console.warn(
                "STAGE 7 GROUP: Partial atomic commit detected. Rolling back."
            );


            rollbackEverything();

            console.groupEnd();

            return {
                repaired: false,
                entries: [],
                moved: [],
                reason:
                    "Parallel group atomic commit failed and was rolled back.",
                occurrence:
                    occurrenceKey
            };

        }


        // ====================================================
        // VERIFY ALL GROUP MEMBERS
        // ====================================================

        const committedPeriodIds =
            groupTasks.map(
                task =>
                    getPeriodId(task)
            );


        const allSamePeriod =
            committedPeriodIds.every(
                id =>
                    id ===
                    periodId
            );


        if (!allSamePeriod) {

            console.error(
                "STAGE 7 GROUP: Atomic placement produced different periods."
            );


            rollbackEverything();

            console.groupEnd();

            return {
                repaired: false,
                entries: [],
                moved: [],
                reason:
                    "Parallel group verification failed: members are not synchronized.",
                occurrence:
                    occurrenceKey
            };

        }


        // ====================================================
        // UPDATE placedTasks
        // ====================================================

        if (
            !Array.isArray(
                generatorData.placedTasks
            )
        ) {

            generatorData.placedTasks =
                [];

        }


        for (
            const task
            of groupTasks
        ) {

            const taskId =
                getTaskId(task);


            const alreadyExists =
                generatorData.placedTasks.some(
                    entry =>
                        getTaskId(entry) ===
                        taskId
                );


            if (
                !alreadyExists
            ) {

                const room =
                    roomAssignment[
                        taskId
                    ] || null;


                const entry =
                    createGeneratedEntry(
                        task,
                        period,
                        room
                    );


                if (entry) {

                    generatorData.placedTasks.push(
                        entry
                    );

                }

            }

        }


        // ====================================================
        // REBUILD INDEXES AFTER SUCCESSFUL COMMIT
        // ====================================================

        if (
            typeof createOccupancyIndexes ===
            "function"
        ) {

            try {

                const rebuilt =
                    createOccupancyIndexes(
                        generatorData
                    );


                if (rebuilt) {

                    Object.keys(
                        indexes
                    ).forEach(
                        key => {

                            if (
                                rebuilt[key] !==
                                undefined
                            ) {

                                indexes[key] =
                                    rebuilt[key];

                            }

                        }
                    );

                }

            } catch (
                rebuildError
            ) {

                console.warn(
                    "STAGE 7 GROUP: Final index rebuild failed:",
                    rebuildError
                );

            }

        }


        // ====================================================
        // BUILD MOVED RECORDS
        // ====================================================

        const moved =
            [
                ...movedBlockers
            ];


        // ====================================================
        // SUCCESS
        // ====================================================

        console.log(
            "STAGE 7 GROUP REPAIRED:",
            {
                parallelGroup,
                occurrence:
                    occurrenceKey,
                periodId,
                members:
                    groupTasks.map(
                        task =>
                            getTaskId(task)
                    ),
                movedBlockers:
                    moved.length
            }
        );


        console.groupEnd();


        return {
            repaired: true,
            entries:
                committedEntries,
            moved,
            periodId,
            parallelGroup,
            occurrence:
                occurrenceKey,
            reason:
                moved.length > 0
                    ? "Parallel group repaired after safe single-lesson blocker relocation."
                    : "Parallel group repaired without blocker relocation."
        };

    }


    // ========================================================
    // NO COMMON PERIOD COULD BE COMMITTED
    // ========================================================

    console.warn(
        "STAGE 7 GROUP: All common periods failed atomic placement."
    );


    rollbackEverything();

    console.groupEnd();


    return {
        repaired: false,
        entries: [],
        moved: [],
        reason:
            `All common synchronized periods failed atomic placement for ${parallelGroup}.`,
        occurrence:
            occurrenceKey,
        diagnostics:
            groupDiagnostics
    };

}




function buildStage7PeriodCandidates(
    task,
    periods
) {

    if (
        !Array.isArray(
            periods
        )
    ) {

        return [];

    }


    const candidates =
        periods
            .filter(
                period =>
                    period &&
                    (
                        period.id ||
                        period.period_id
                    )
            )
            .map(
                period => {

                    return {

                        ...period,

                        id:
                            period.id ??
                            period.period_id,

                        dayNumber:
                            period.dayNumber ??
                            period.day_number,

                        periodOrder:
                            period.periodOrder ??
                            period.period_order ??
                            period.periodNumber ??
                            period.period_number

                    };

                }
            )
            .sort(
                (
                    a,
                    b
                ) => {

                    const dayA =
                        Number(
                            a.dayNumber ??
                            a.day_number ??
                            0
                        );


                    const dayB =
                        Number(
                            b.dayNumber ??
                            b.day_number ??
                            0
                        );


                    if (
                        dayA !==
                        dayB
                    ) {

                        return (
                            dayA -
                            dayB
                        );

                    }


                    const orderA =
                        Number(
                            a.periodOrder ??
                            a.period_order ??
                            a.periodNumber ??
                            a.period_number ??
                            0
                        );


                    const orderB =
                        Number(
                            b.periodOrder ??
                            b.period_order ??
                            b.periodNumber ??
                            b.period_number ??
                            0
                        );


                    return (
                        orderA -
                        orderB
                    );

                }
            );


    return candidates;

}


// ============================================================
// STAGE 7 — BUILD ROOM CANDIDATES
// ============================================================

function buildStage7RoomCandidates(
    task,
    rooms
) {

    if (
        !task
    ) {

        return [];

    }


    // ========================================================
    // DETERMINE WHETHER A ROOM IS REQUIRED
    // ========================================================

    const requiresRoom =
        task.requiresRoom === true ||
        task.requires_room === true;


    // ========================================================
    // ROOMLESS TASK
    // ========================================================
    //
    // A lesson that does not require a room must be placed
    // with null.
    //
    // Do NOT allow it to consume an actual room.
    //
    // ========================================================

    if (
        !requiresRoom
    ) {

        return [
            null
        ];

    }


    // ========================================================
    // ROOM IS REQUIRED
    // ========================================================

    if (
        !Array.isArray(rooms) ||
        rooms.length === 0
    ) {

        return [];

    }


    // ========================================================
    // NORMALIZE VALID ROOMS
    // ========================================================

    const validRooms =
        rooms.filter(
            room =>
                room &&
                room.id
        );


    if (
        validRooms.length === 0
    ) {

        return [];

    }


    // ========================================================
    // FIND REQUIRED ROOM TYPE
    // ========================================================
    //
    // Support all room-type field names used elsewhere in the
    // timetable data.
    //
    // ========================================================

    const requiredRoomType =
        task.roomTypeId ??
        task.room_type_id ??
        task.requiredRoomTypeId ??
        task.required_room_type_id ??
        task.requiredRoomType ??
        task.required_room_type ??
        null;


    // ========================================================
    // NO ROOM TYPE SPECIFIED
    // ========================================================
    //
    // The task requires a room, but does not specify a type.
    //
    // Any valid room may therefore be considered.
    //
    // ========================================================

    if (
        !requiredRoomType
    ) {

        return [
            ...validRooms
        ];

    }


    // ========================================================
    // FILTER BY ROOM TYPE
    // ========================================================

    const normalizedRequiredRoomType =
        normalizeTimetableId(
            requiredRoomType
        );


    if (
        !normalizedRequiredRoomType
    ) {

        return [
            ...validRooms
        ];

    }


    const compatibleRooms =
        validRooms.filter(
            room => {

                const roomTypeId =
                    room.roomTypeId ??
                    room.room_type_id ??
                    room.typeId ??
                    room.type_id ??
                    null;


                const normalizedRoomTypeId =
                    normalizeTimetableId(
                        roomTypeId
                    );


                return (
                    normalizedRoomTypeId &&
                    normalizedRoomTypeId ===
                    normalizedRequiredRoomType
                );

            }
        );


    return compatibleRooms;

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
        !generatorData ||
        !generatorData.indexes
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Invalid Stage 7 placement data."

        };

    }


    // ========================================================
    // STAGE 7 CURRENTLY REPAIRS SINGLE LESSONS ONLY
    // ========================================================

    const taskType =
        task.taskType ??
        task.task_type ??
        task.type ??
        null;


    if (
        taskType === "double" ||
        task.isDouble === true ||
        task.is_double === true
    ) {

        console.warn(
            "STAGE 7: Double lesson placement adapter is not enabled.",
            task.taskId ||
            task.task_id ||
            task.id
        );

        return {

            placed:
                false,

            entries:
                [],

            reason:
                "Stage 7 double-lesson relocation is disabled."

        };

    }


    // ========================================================
    // BUILD SMART CANDIDATE SHAPE
    // ========================================================

    const candidate = {

        taskId:
            task.taskId ??
            task.task_id ??
            task.id ??
            null,

        period,

        room:
            room ||
            null,

        score:
            0,

        reasons:
            [
                "Stage 7 repair candidate."
            ]

    };


    // ========================================================
    // FINAL PLACEMENT THROUGH STAGE 6F ENGINE
    // ========================================================
    //
    // This is important.
    //
    // Stage 7 must NOT have its own independent conflict rules.
    //
    // placeSelectedSingleTask()
    //      ->
    // checkSingleSlotConflict()
    //      ->
    // reserveSlot()
    //      ->
    // createGeneratedEntry()
    //
    // Therefore Stage 7 inherits the same:
    //
    // - parallel rules
    // - teacher rules
    // - student-group rules
    // - room rules
    // - daily limits
    // - weekly limits
    // - consecutive limits
    //
    // ========================================================

    const placement =
        placeSelectedSingleTask(
            task,
            candidate,
            generatorData.indexes
        );


    // ========================================================
    // PLACEMENT FAILED
    // ========================================================

    if (
        !placement ||
        placement.placed !== true
    ) {

        return {

            placed:
                false,

            entries:
                [],

            reason:
                placement?.reason ||
                "Stage 7 single-lesson placement failed."

        };

    }


    // ========================================================
    // SUCCESS
    // ========================================================

    return {

        placed:
            true,

        entries:
            Array.isArray(
                placement.entries
            )
                ? [
                    ...placement.entries
                ]
                : [],

        reason:
            ""

    };

}





// ============================================================
// STAGE 7 — RELOCATION
// ============================================================
//
// Moves an existing SINGLE lesson out of the way so the
// failed lesson can occupy the freed original slot.
//
// HELPER CONTRACTS:
//
//     moveStage7Task()
//         → true / false
//
//     placeStage7Task()
//         → {
//               placed,
//               entries,
//               reason
//           }
//
// IMPORTANT:
//
// Do NOT test the entire placeStage7Task() return object
// directly as a boolean.
//
// Always use:
//
//     placement.placed === true
//
// ============================================================

function attemptStage7Relocation(
    failedTask,
    candidatePeriods,
    rooms,
    generatorData
) {

    if (
        !failedTask ||
        !Array.isArray(candidatePeriods) ||
        !generatorData ||
        !generatorData.indexes
    ) {

        return {

            repaired:
                false,

            entries:
                [],

            moved:
                []

        };

    }


    const placedTasks =
        Array.isArray(
            generatorData.placedTasks
        )
            ? generatorData.placedTasks
            : [];


    if (
        placedTasks.length === 0
    ) {

        return {

            repaired:
                false,

            entries:
                [],

            moved:
                []

        };

    }


    let moveAttempts =
        0;


    // ========================================================
    // BUILD FAILED-TASK ROOM CANDIDATES ONCE
    // ========================================================

    const failedTaskRoomCandidates =
        buildStage7RoomCandidates(
            failedTask,
            rooms
        );


    if (
        !Array.isArray(
            failedTaskRoomCandidates
        ) ||
        failedTaskRoomCandidates.length === 0
    ) {

        return {

            repaired:
                false,

            entries:
                [],

            moved:
                []

        };

    }


    // ========================================================
    // LOOK FOR A SINGLE LESSON TO MOVE
    // ========================================================

    for (
        const existingTask of placedTasks
    ) {

        // ----------------------------------------------------
        // MOVE LIMIT
        // ----------------------------------------------------

        if (
            moveAttempts >=
            STAGE7_CONFIG.maxMovesPerTask
        ) {

            break;

        }


        if (
            !existingTask
        ) {

            continue;

        }


        // ====================================================
        // NORMALIZE EXISTING TASK TYPE
        // ====================================================

        const existingTaskType =
            existingTask.taskType ??
            existingTask.task_type ??
            existingTask.type ??
            null;


        // ====================================================
        // NEVER MOVE DOUBLE LESSONS
        // ====================================================

        if (
            existingTaskType === "double" ||
            existingTask.isDouble === true ||
            existingTask.is_double === true
        ) {

            continue;

        }


        // ====================================================
        // FIND SAFE NEW LOCATION
        // ====================================================

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


        moveAttempts++;


        // ====================================================
        // MOVE EXISTING TASK
        // ====================================================

        const moved =
            moveStage7Task(
                existingTask,
                alternative.period,
                alternative.room,
                generatorData,
                alternative.oldPeriod,
                alternative.oldRoom
            );


        if (
            moved !== true
        ) {

            continue;

        }


        // ====================================================
        // CAPTURE MOVED ENTRY
        // ========================================================

        const movedEntry =
            existingTask.stage7MovedEntry ||
            null;


        // ====================================================
        // BUILD ORDERED FAILED-TASK ROOMS
        // ====================================================

        const orderedFailedTaskRooms = [];


        if (
            alternative.failedRoom
        ) {

            orderedFailedTaskRooms.push(
                alternative.failedRoom
            );

        }


        for (
            const failedRoom of failedTaskRoomCandidates
        ) {

            if (
                !failedRoom
            ) {

                if (
                    !orderedFailedTaskRooms.includes(
                        null
                    )
                ) {

                    orderedFailedTaskRooms.push(
                        null
                    );

                }

                continue;

            }


            const alreadyIncluded =
                orderedFailedTaskRooms.some(
                    candidate =>
                        candidate &&
                        String(candidate.id) ===
                        String(failedRoom.id)
                );


            if (
                !alreadyIncluded
            ) {

                orderedFailedTaskRooms.push(
                    failedRoom
                );

            }

        }


        // ====================================================
        // TRY FAILED TASK IN FREED ORIGINAL SLOT
        // ====================================================

        let failedTaskPlacement =
            null;


        for (
            const failedRoom of orderedFailedTaskRooms
        ) {

            const failedTaskConflict =
                checkSingleSlotConflict(
                    failedTask,
                    alternative.oldPeriod,
                    failedRoom,
                    generatorData.indexes
                );


            if (
                !failedTaskConflict ||
                failedTaskConflict.valid !== true
            ) {

                continue;

            }


            const placement =
                placeStage7Task(
                    failedTask,
                    alternative.oldPeriod,
                    failedRoom,
                    generatorData
                );


            if (
                placement &&
                placement.placed === true
            ) {

                failedTaskPlacement =
                    placement;

                break;

            }

        }


        // ====================================================
        // SUCCESS
        // ====================================================

        if (
            failedTaskPlacement &&
            failedTaskPlacement.placed === true
        ) {

            const repairedEntries =
                Array.isArray(
                    failedTaskPlacement.entries
                )
                    ? [
                        ...failedTaskPlacement.entries
                    ]
                    : [];


            // ------------------------------------------------
            // ADD MOVED EXISTING LESSON
            // ------------------------------------------------

            if (
                movedEntry
            ) {

                repairedEntries.push(
                    movedEntry
                );

            }


            // ------------------------------------------------
            // RECORD MOVE
            // ------------------------------------------------

            const movedRecord = {

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

            };


            // ------------------------------------------------
            // CLEAN TEMPORARY MARKER
            // ------------------------------------------------

            existingTask.stage7MovedEntry =
                null;


            return {

                repaired:
                    true,

                entries:
                    repairedEntries,

                moved:
                    [
                        movedRecord
                    ]

            };

        }


        // ====================================================
        // FAILED TASK COULD NOT USE FREED SLOT
        // ====================================================
        //
        // Restore the moved lesson exactly where it came from.
        //
        // ====================================================

        const restored =
            moveStage7Task(
                existingTask,
                alternative.oldPeriod,
                alternative.oldRoom,
                generatorData,
                alternative.period,
                alternative.room
            );


        if (
            restored !== true
        ) {

            console.error(
                "STAGE 7: CRITICAL — failed to restore existing task after relocation failure.",
                {

                    taskId:
                        existingTask?.taskId ||
                        existingTask?.task_id ||
                        existingTask?.id,

                    originalPeriod:
                        alternative.oldPeriod?.id,

                    originalRoom:
                        alternative.oldRoom?.id ||
                        null,

                    attemptedPeriod:
                        alternative.period?.id,

                    attemptedRoom:
                        alternative.room?.id ||
                        null

                }
            );


            return {

                repaired:
                    false,

                entries:
                    [],

                moved:
                    []

            };

        }


        existingTask.stage7MovedEntry =
            null;

    }


    // ========================================================
    // NO RELOCATION FOUND
    // ========================================================

    return {

        repaired:
            false,

        entries:
            [],

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
        !failedTask ||
        !Array.isArray(candidatePeriods) ||
        !generatorData
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


    // ========================================================
    // NORMALIZE PARALLEL GROUPS
    // ========================================================
    //
    // Stage 7 single-task relocation MUST NOT manipulate
    // individual members of a parallel group.
    //
    // Parallel lessons are synchronized atomically by Stage 6F.
    //
    // Moving one member independently would split the group.
    //
    // Therefore:
    //
    //     grouped existing task -> NOT movable here
    //     grouped failed task   -> NOT repairable here
    //
    // A dedicated atomic parallel-group repair must handle
    // those cases.
    //
    // ========================================================

    const existingTaskParallelGroup =
        normalizeTimetableId(
            existingTask.parallelGroup ??
            existingTask.parallel_group ??
            null
        );


    const failedTaskParallelGroup =
        normalizeTimetableId(
            failedTask.parallelGroup ??
            failedTask.parallel_group ??
            null
        );


    if (
        existingTaskParallelGroup
    ) {

        console.log(
            "STAGE 7: Skipping grouped existing task during single-task relocation:",
            {

                taskId:
                    existingTask?.taskId ||
                    existingTask?.id,

                parallelGroup:
                    existingTaskParallelGroup

            }
        );


        return null;

    }


    if (
        failedTaskParallelGroup
    ) {

        console.log(
            "STAGE 7: Skipping grouped failed task during single-task relocation:",
            {

                taskId:
                    failedTask?.taskId ||
                    failedTask?.id,

                parallelGroup:
                    failedTaskParallelGroup

            }
        );


        return null;

    }


    // ========================================================
    // FIND CURRENT SLOT
    // ========================================================

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


    // ========================================================
    // BUILD ROOMS FOR EXISTING TASK
    // ========================================================

    const existingTaskRooms =
        buildStage7RoomCandidates(
            existingTask,
            rooms
        );


    if (
        !Array.isArray(
            existingTaskRooms
        ) ||
        existingTaskRooms.length === 0
    ) {

        return null;

    }


    // ========================================================
    // BUILD ROOMS FOR FAILED TASK
    // ========================================================

    const failedTaskRooms =
        buildStage7RoomCandidates(
            failedTask,
            rooms
        );


    if (
        !Array.isArray(
            failedTaskRooms
        ) ||
        failedTaskRooms.length === 0
    ) {

        return null;

    }


    // ========================================================
    // TEMPORARILY RELEASE EXISTING TASK
    // ========================================================
    //
    // The task is released only while searching.
    //
    // The original reservation MUST be restored before this
    // function returns.
    //
    // ========================================================

    const released =
        releaseReservedSlot(
            existingTask,
            oldPeriod,
            oldRoom,
            indexes
        );


    if (
        released !== true
    ) {

        console.warn(
            "STAGE 7: Could not temporarily release existing task while searching for an alternative.",
            {

                taskId:
                    existingTask?.taskId ||
                    existingTask?.id,

                oldPeriod:
                    oldPeriod?.id,

                oldRoom:
                    oldRoom?.id ||
                    null

            }
        );

        return null;

    }


    let alternative =
        null;


    // ========================================================
    // SEARCH FOR A VALID RELOCATION
    // ========================================================
    //
    // Both conditions must be valid:
    //
    // 1. Existing task can move to the new period/room.
    //
    // 2. Failed task can use the existing task's original
    //    period after it has moved.
    //
    // ========================================================

    for (
        const period of candidatePeriods
    ) {

        // ----------------------------------------------------
        // DO NOT RETURN TO THE SAME PERIOD
        // ----------------------------------------------------

        if (
            String(
                period.id
            ) ===
            String(
                oldPeriod.id
            )
        ) {

            continue;

        }


        for (
            const room of existingTaskRooms
        ) {

            // ------------------------------------------------
            // CHECK EXISTING TASK AT NEW LOCATION
            // ------------------------------------------------

            const existingTaskConflict =
                checkSingleSlotConflict(
                    existingTask,
                    period,
                    room,
                    indexes
                );


            if (
                !existingTaskConflict ||
                existingTaskConflict.valid !== true
            ) {

                continue;

            }


            // ------------------------------------------------
            // CHECK FAILED TASK IN FREED ORIGINAL SLOT
            // ------------------------------------------------

            let failedTaskCanUseFreedSlot =
                false;


            for (
                const failedRoom of failedTaskRooms
            ) {

                const failedTaskConflict =
                    checkSingleSlotConflict(
                        failedTask,
                        oldPeriod,
                        failedRoom,
                        indexes
                    );


                if (
                    failedTaskConflict &&
                    failedTaskConflict.valid === true
                ) {

                    failedTaskCanUseFreedSlot =
                        true;


                    alternative = {

                        period,

                        room,

                        oldPeriod,

                        oldRoom,

                        failedRoom

                    };


                    break;

                }

            }


            if (
                failedTaskCanUseFreedSlot
            ) {

                break;

            }

        }


        if (
            alternative
        ) {

            break;

        }

    }


    // ========================================================
    // RESTORE ORIGINAL RESERVATION
    // ========================================================
    //
    // This function only searches.
    //
    // It does NOT perform the move.
    //
    // Therefore the existing task must always be restored
    // before returning the alternative.
    //
    // ========================================================

    const restored =
        checkSingleSlotConflict(
            existingTask,
            oldPeriod,
            oldRoom,
            indexes
        );


    if (
        !restored ||
        restored.valid !== true
    ) {

        console.error(
            "STAGE 7: CRITICAL — original task slot became invalid while searching for relocation.",
            {

                taskId:
                    existingTask?.taskId ||
                    existingTask?.id,

                oldPeriod:
                    oldPeriod?.id,

                oldRoom:
                    oldRoom?.id ||
                    null,

                alternativePeriod:
                    alternative?.period?.id ||
                    null,

                alternativeRoom:
                    alternative?.room?.id ||
                    null,

                failedRoom:
                    alternative?.failedRoom?.id ||
                    null

            }
        );


        return null;

    }


    const restoredReservation =
        reserveSlot(
            existingTask,
            oldPeriod,
            oldRoom,
            indexes
        );


    if (
        restoredReservation !== true
    ) {

        console.error(
            "STAGE 7: CRITICAL — failed to restore original task reservation after alternative search.",
            {

                taskId:
                    existingTask?.taskId ||
                    existingTask?.id,

                oldPeriod:
                    oldPeriod?.id,

                oldRoom:
                    oldRoom?.id ||
                    null

            }
        );


        return null;

    }


    return alternative;

}


// ============================================================
// FIND CURRENT PERIOD OF TASK
// ============================================================

function findTaskPeriod(
    task,
    generatorData
) {

    if (
        !task ||
        !generatorData
    ) {

        return null;

    }


    const periods =
        generatorData.periods ||
        [];


    // --------------------------------------------------------
    // PERIOD IDS ARRAY
    // --------------------------------------------------------

    if (
        Array.isArray(
            task.periodIds
        ) &&
        task.periodIds.length > 0 &&
        task.periodIds[0]
    ) {

        const periodId =
            task.periodIds[0];


        const period =
            periods.find(
                candidate =>
                    String(candidate.id) ===
                    String(periodId)
            );


        if (
            period
        ) {

            return period;

        }

    }


    // --------------------------------------------------------
    // SINGLE PERIOD ID
    // --------------------------------------------------------

    if (
        task.periodId
    ) {

        return periods.find(
            period =>
                String(period.id) ===
                String(task.periodId)
        ) || null;

    }


    // --------------------------------------------------------
    // SNAKE_CASE PERIOD ID
    // --------------------------------------------------------

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

    if (
        !task ||
        !generatorData
    ) {

        return null;

    }


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
//
// Moves an EXISTING SINGLE lesson from its current slot to:
//
//     newPeriod
//     newRoom
//
// This implementation does NOT depend on:
//
//     moveTaskToSlot()
//     removeTaskFromSlot()
//     placeTaskInSlot()
//
// It directly uses the existing Stage 6 occupancy engine:
//
//     releaseReservedSlot()
//     checkSingleSlotConflict()
//     reserveSlot()
//     createGeneratedEntry()
//
// IMPORTANT:
//
// This function is intended for SINGLE lessons only.
// Double lessons are not moved by the current Stage 7
// configuration.
//
// ============================================================


function moveStage7Task(
    task,
    newPeriod,
    newRoom,
    generatorData,
    rollbackPeriod = null,
    rollbackRoom = null
) {

    if (
        !task ||
        !newPeriod ||
        !generatorData ||
        !generatorData.indexes
    ) {

        return false;

    }


    const indexes =
        generatorData.indexes;


    // ========================================================
    // CLEAR ANY STALE STAGE 7 ENTRY
    // ========================================================
    //
    // A task may have been involved in an earlier relocation
    // attempt. Never allow a previous temporary entry to be
    // reused by a later failed move.
    //
    // ========================================================

    task.stage7MovedEntry =
        null;


    // ========================================================
    // NORMALIZE TASK TYPE
    // ========================================================

    const taskType =
        task.taskType ||
        task.type ||
        null;


    // ========================================================
    // DO NOT MOVE DOUBLE LESSONS
    // ========================================================

    if (
        taskType === "double" ||
        task.isDouble === true
    ) {

        console.warn(
            "STAGE 7: Double lesson movement is disabled:",
            task?.taskId ||
            task?.id
        );

        return false;

    }


    // ========================================================
    // FIND CURRENT SLOT
    // ========================================================
    //
    // When rollbackPeriod is supplied, the caller is telling us
    // that the task is currently at that location and must be
    // moved back from there.
    //
    // Otherwise find the task's current normal location.
    //
    // ========================================================

    const oldPeriod =
        rollbackPeriod ||
        findTaskPeriod(
            task,
            generatorData
        );


    const oldRoom =
        rollbackPeriod
            ? rollbackRoom
            : findTaskRoom(
                task,
                generatorData
            );


    if (
        !oldPeriod
    ) {

        console.warn(
            "STAGE 7: Cannot move task because its current period was not found.",
            {

                taskId:
                    task?.taskId ||
                    task?.id

            }
        );

        return false;

    }


    // ========================================================
    // DO NOT MOVE TO THE SAME SLOT
    // ========================================================

    if (
        String(
            oldPeriod.id
        ) ===
        String(
            newPeriod.id
        ) &&
        String(
            oldRoom?.id ||
            ""
        ) ===
        String(
            newRoom?.id ||
            ""
        )
    ) {

        return false;

    }


    // ========================================================
    // RELEASE CURRENT SLOT
    // ========================================================
    //
    // The task must be removed from the occupancy indexes
    // before its new location is tested.
    //
    // ========================================================

    const released =
        releaseReservedSlot(
            task,
            oldPeriod,
            oldRoom,
            indexes
        );


    if (
        released !== true
    ) {

        console.warn(
            "STAGE 7: Failed to release existing task slot.",
            {

                taskId:
                    task?.taskId ||
                    task?.id,

                oldPeriod:
                    oldPeriod?.id,

                oldRoom:
                    oldRoom?.id ||
                    null

            }
        );

        return false;

    }


    // ========================================================
    // CHECK NEW SLOT
    // ========================================================

    const conflict =
        checkSingleSlotConflict(
            task,
            newPeriod,
            newRoom,
            indexes
        );


    if (
        !conflict ||
        conflict.valid !== true
    ) {

        // ----------------------------------------------------
        // New slot is invalid.
        // Restore original reservation.
        // ----------------------------------------------------

        const restored =
            checkSingleSlotConflict(
                task,
                oldPeriod,
                oldRoom,
                indexes
            );


        if (
            restored &&
            restored.valid === true
        ) {

            const restoredReservation =
                reserveSlot(
                    task,
                    oldPeriod,
                    oldRoom,
                    indexes
                );


            if (
                restoredReservation !== true
            ) {

                console.error(
                    "STAGE 7: CRITICAL — original slot reservation failed during rollback.",
                    {

                        taskId:
                            task?.taskId ||
                            task?.id,

                        oldPeriod:
                            oldPeriod?.id,

                        oldRoom:
                            oldRoom?.id ||
                            null

                    }
                );

            }

        }
        else {

            console.error(
                "STAGE 7: CRITICAL — original task slot could not be restored.",
                {

                    taskId:
                        task?.taskId ||
                        task?.id,

                    oldPeriod:
                        oldPeriod?.id,

                    oldRoom:
                        oldRoom?.id ||
                        null,

                    newPeriod:
                        newPeriod?.id,

                    newRoom:
                        newRoom?.id ||
                        null,

                    reason:
                        conflict?.reason ||
                        "Unknown conflict"

                }
            );

        }


        return false;

    }


    // ========================================================
    // RESERVE NEW SLOT
    // ========================================================

    const reserved =
        reserveSlot(
            task,
            newPeriod,
            newRoom,
            indexes
        );


    if (
        reserved !== true
    ) {

        // ----------------------------------------------------
        // Restore original slot.
        // ----------------------------------------------------

        const restored =
            checkSingleSlotConflict(
                task,
                oldPeriod,
                oldRoom,
                indexes
            );


        if (
            restored &&
            restored.valid === true
        ) {

            const restoredReservation =
                reserveSlot(
                    task,
                    oldPeriod,
                    oldRoom,
                    indexes
                );


            if (
                restoredReservation !== true
            ) {

                console.error(
                    "STAGE 7: CRITICAL — original slot reservation failed after new-slot reservation failure.",
                    {

                        taskId:
                            task?.taskId ||
                            task?.id

                    }
                );

            }

        }
        else {

            console.error(
                "STAGE 7: CRITICAL — failed to reserve new slot and original slot is no longer valid.",
                {

                    taskId:
                        task?.taskId ||
                        task?.id,

                    oldPeriod:
                        oldPeriod?.id,

                    oldRoom:
                        oldRoom?.id ||
                        null

                }
            );

        }


        return false;

    }


    // ========================================================
    // CREATE NEW GENERATED ENTRY
    // ========================================================

    const newEntry =
        createGeneratedEntry(
            task,
            newPeriod,
            newRoom
        );


    // ========================================================
    // ENTRY CREATION FAILURE
    // ========================================================

    if (
        !newEntry
    ) {

        // ----------------------------------------------------
        // Remove the new reservation.
        // ----------------------------------------------------

        const releasedNewSlot =
            releaseReservedSlot(
                task,
                newPeriod,
                newRoom,
                indexes
            );


        if (
            releasedNewSlot !== true
        ) {

            console.error(
                "STAGE 7: CRITICAL — failed to release new slot after entry creation failure.",
                {

                    taskId:
                        task?.taskId ||
                        task?.id,

                    newPeriod:
                        newPeriod?.id,

                    newRoom:
                        newRoom?.id ||
                        null

                }
            );

        }


        // ----------------------------------------------------
        // Restore original reservation.
        // ----------------------------------------------------

        const restored =
            checkSingleSlotConflict(
                task,
                oldPeriod,
                oldRoom,
                indexes
            );


        if (
            restored &&
            restored.valid === true
        ) {

            const restoredReservation =
                reserveSlot(
                    task,
                    oldPeriod,
                    oldRoom,
                    indexes
                );


            if (
                restoredReservation !== true
            ) {

                console.error(
                    "STAGE 7: CRITICAL — original slot could not be re-reserved after entry creation failure.",
                    {

                        taskId:
                            task?.taskId ||
                            task?.id

                    }
                );

            }

        }
        else {

            console.error(
                "STAGE 7: CRITICAL — original slot could not be restored after entry creation failure.",
                {

                    taskId:
                        task?.taskId ||
                        task?.id,

                    oldPeriod:
                        oldPeriod?.id,

                    oldRoom:
                        oldRoom?.id ||
                        null

                }
            );

        }


        return false;

    }


    // ========================================================
    // UPDATE TASK LOCATION
    // ========================================================

    task.placed =
        true;


    task.periodIds =
        [
            newPeriod.id
        ];


    task.periodId =
        newPeriod.id;


    task.period_id =
        newPeriod.id;


    task.firstPeriodId =
        null;


    task.secondPeriodId =
        null;


    task.roomId =
        newRoom?.id ||
        null;


    task.room_id =
        newRoom?.id ||
        null;


    // ========================================================
    // STORE MOVED ENTRY FOR STAGE 7
    // ========================================================
    //
    // attemptStage7Relocation() reads this entry and returns
    // it together with the repaired failed-task entry.
    //
    // ========================================================

    task.stage7MovedEntry =
        newEntry;


    // ========================================================
    // LOG
    // ========================================================

    console.log(
        "STAGE 7 TASK MOVED:",
        {

            taskId:
                task?.taskId ||
                task?.id,

            fromPeriod:
                oldPeriod?.id ||
                null,

            fromRoom:
                oldRoom?.id ||
                null,

            toPeriod:
                newPeriod?.id ||
                null,

            toRoom:
                newRoom?.id ||
                null

        }
    );


    return true;

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
