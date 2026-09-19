
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

    placedTasks: [],

    // ========================================================
    // PARALLEL GROUP INDEX
    // ========================================================
    //
    // Key:
    //
    //     normalized parallel group name
    //
    // Value:
    //
    // {
    //     groupKey,
    //     streams,
    //     requirements,
    //     subjects,
    //     streamIds,
    //     requirementIds
    // }
    //
    // This is SCHOOL-WIDE.
    //
    // Therefore later stages can determine:
    //
    // "Which streams must participate in this
    //  parallel-group occurrence?"
    //
    // ========================================================

    parallelGroups:
        new Map(),

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


// ============================================================
// NORMALIZE PARALLEL GROUP KEY
// ============================================================
//
// Parallel-group names must be compared consistently.
//
// Example:
//
//     "RE/GE/BS"
//     " RE/GE/BS "
//     "re/ge/bs"
//
// All become:
//
//     "RE/GE/BS"
//
// ============================================================

function normalizeParallelGroupKey(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return null;

    }


    const key =
        String(value)
            .trim()
            .toUpperCase();


    if (!key) {

        return null;

    }


    return key;

}



// ============================================================
// BUILD SCHOOL-WIDE PARALLEL GROUP INDEX
// ============================================================
//
// PURPOSE:
//
// A parallel group is SCHOOL-WIDE.
//
// Example:
//
//     RE/GE/BS
//
// If the group exists in:
//
//     10A
//     10B
//     10C
//     10D
//     10E
//
// then ALL participating requirements must ultimately use the
// SAME parallel occurrence period.
//
// The index created here is the authoritative description of
// which streams and requirements belong to each group.
//
// ============================================================

function buildParallelGroupIndex(
    requirements,
    streams
) {

    const parallelGroups =
        new Map();


    if (
        !Array.isArray(requirements)
    ) {

        return parallelGroups;

    }


    // ========================================================
    // BUILD STREAM LOOKUP
    // ========================================================

    const streamMap =
        new Map();


    if (
        Array.isArray(streams)
    ) {

        streams.forEach(
            stream => {

                if (
                    !stream ||
                    !stream.id
                ) {

                    return;

                }


                streamMap.set(
                    String(stream.id),
                    stream
                );

            }
        );

    }


    // ========================================================
    // PROCESS REQUIREMENTS
    // ========================================================

    requirements.forEach(
        requirement => {

            if (
                !requirement
            ) {

                return;

            }


            const groupKey =
                normalizeParallelGroupKey(
                    requirement.parallelGroup ??
                    requirement.parallel_group
                );


            // ------------------------------------------------
            // REQUIREMENT IS NOT PARALLEL
            // ------------------------------------------------

            if (
                !groupKey
            ) {

                return;

            }


            // ------------------------------------------------
            // CREATE GROUP
            // ------------------------------------------------

            if (
                !parallelGroups.has(
                    groupKey
                )
            ) {

                parallelGroups.set(
                    groupKey,
                    {

                        groupKey,

                        // Map:
                        //
                        // streamId -> {
                        //     streamId,
                        //     stream,
                        //     requirements: []
                        // }
                        //
                        streams:
                            new Map(),

                        // ALL requirements participating
                        // in this parallel group.
                        requirements:
                            [],

                        // subjectId -> requirement list
                        //
                        // IMPORTANT:
                        // The same subject may exist in several
                        // streams, so do NOT store only one
                        // requirement per subject.
                        subjects:
                            new Map(),

                        streamIds:
                            new Set(),

                        requirementIds:
                            new Set()

                    }

                );

            }


            const group =
                parallelGroups.get(
                    groupKey
                );


            // =================================================
            // NORMALIZED IDS
            // =================================================

            const streamId =
                requirement.streamId ??
                requirement.stream_id ??
                null;


            const requirementId =
                requirement.requirementId ??
                requirement.id ??
                null;


            const subjectId =
                requirement.subjectId ??
                requirement.subject_id ??
                null;


            // =================================================
            // REGISTER STREAM
            // =================================================

            if (
                streamId
            ) {

                const normalizedStreamId =
                    String(streamId);


                group.streamIds.add(
                    normalizedStreamId
                );


                const stream =
                    streamMap.get(
                        normalizedStreamId
                    ) ||
                    null;


                if (
                    !group.streams.has(
                        normalizedStreamId
                    )
                ) {

                    group.streams.set(
                        normalizedStreamId,
                        {

                            streamId:
                                normalizedStreamId,

                            stream,

                            requirements:
                                []

                        }

                    );

                }


                group.streams
                    .get(
                        normalizedStreamId
                    )
                    .requirements
                    .push(
                        requirement
                    );

            }


            // =================================================
            // REGISTER REQUIREMENT
            // =================================================

            if (
                requirementId
            ) {

                group.requirementIds.add(
                    String(requirementId)
                );

            }


            group.requirements.push(
                requirement
            );


            // =================================================
            // REGISTER SUBJECT
            // =================================================
            //
            // A subject can occur in multiple streams.
            //
            // Therefore:
            //
            // subjects Map
            //
            // stores:
            //
            // subjectId -> Array of requirements
            //
            // rather than:
            //
            // subjectId -> one requirement
            //
            // =================================================

            if (
                subjectId
            ) {

                const normalizedSubjectId =
                    String(subjectId);


                if (
                    !group.subjects.has(
                        normalizedSubjectId
                    )
                ) {

                    group.subjects.set(
                        normalizedSubjectId,
                        []
                    );

                }


                group.subjects
                    .get(
                        normalizedSubjectId
                    )
                    .push(
                        requirement
                    );

            }

        }
    );


    // ========================================================
    // CONVERT IMPORTANT SETS TO DETERMINISTIC ARRAYS
    // ========================================================
    //
    // We keep the Sets above because they are useful for fast
    // membership checking.
    //
    // These arrays make later processing predictable.
    //
    // ========================================================

    parallelGroups.forEach(
        group => {

            group.streamIdList =
                [...group.streamIds];


            group.requirementIdList =
                [...group.requirementIds];


            group.streamList =
                group.streamIdList
                    .map(
                        streamId =>
                            group.streams.get(
                                streamId
                            )
                    )
                    .filter(Boolean);


            group.requirementList =
                [...group.requirements];

        }
    );


    // ========================================================
    // DEBUG SUMMARY
    // ========================================================

    console.log(
        "======================================"
    );

    console.log(
        "SCHOOL-WIDE PARALLEL GROUP INDEX"
    );

    console.log(
        "======================================"
    );


    parallelGroups.forEach(
        group => {

            console.log(
                "Parallel group:",
                group.groupKey,
                {

                    streams:
                        group.streamIds.size,

                    streamIds:
                        group.streamIdList,

                    requirements:
                        group.requirements.length,

                    requirementIds:
                        group.requirementIdList,

                    subjects:
                        group.subjects.size

                }
            );


            group.streamList.forEach(
                streamInfo => {

                    console.log(
                        "  Parallel stream:",
                        streamInfo.streamId,
                        {
                            stream:
                                streamInfo.stream,

                            requirements:
                                streamInfo.requirements.map(
                                    requirement => ({
                                        requirementId:
                                            requirement.requirementId,

                                        subjectId:
                                            requirement.subjectId,

                                        teacherId:
                                            requirement.teacherId,

                                        lessonsPerWeek:
                                            requirement.lessonsPerWeek,

                                        doubleLessonsPerWeek:
                                            requirement.doubleLessonsPerWeek

                                    })
                                )

                        }
                    );

                }
            );

        }
    );


    console.log(
        "Total parallel groups:",
        parallelGroups.size
    );


    return parallelGroups;

}




// ============================================================
// NORMALIZE GENERATOR DATA
// ============================================================


// ============================================================
// NORMALIZE GENERATOR DATA
// ============================================================

function normalizeGeneratorData(
    data
) {

    const normalized = {

        school:
            data?.school ||
            null,

        schoolId:
            data?.schoolId ||
            timetableState?.schoolId ||
            null,

        streams:
            Array.isArray(
                data?.streams
            )
                ? [...data.streams]
                : [],

        subjects:
            Array.isArray(
                data?.subjects
            )
                ? [...data.subjects]
                : [],

        teachers:
            Array.isArray(
                data?.teachers
            )
                ? [...data.teachers]
                : [],

        rooms:
            Array.isArray(
                data?.rooms
            )
                ? [...data.rooms]
                : [],

        periods:
            Array.isArray(
                data?.periods
            )
                ? [...data.periods]
                : [],

        requirements:
            Array.isArray(
                data?.requirements
            )
                ? [...data.requirements]
                : [],

        lessonTasks:
            Array.isArray(
                data?.lessonTasks
            )
                ? [...data.lessonTasks]
                : [],

        placedTasks:
            Array.isArray(
                data?.placedTasks
            )
                ? [...data.placedTasks]
                : [],

        parallelGroups:
            new Map(),

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
                        period?.period_type ??
                        period?.periodType ??
                        "lesson"
                    )
                        .trim()
                        .toLowerCase();


                return {

                    ...period,

                    dayNumber:
                        Number(
                            period?.day_number ??
                            period?.dayNumber
                        ) || 0,

                    periodNumber:
                        Number(
                            period?.period_number ??
                            period?.periodNumber
                        ) || 0,

                    periodOrder:
                        Number(
                            period?.period_order ??
                            period?.periodOrder ??
                            period?.period_number ??
                            period?.periodNumber
                        ) || 0,

                    isTeachingPeriod:
                        period?.is_teaching_period !== false &&
                        period?.isTeachingPeriod !== false,

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
                        requirement?.lessons_per_week ??
                        requirement?.lessonsPerWeek
                    );


                const doubleLessonsPerWeek =
                    Number(
                        requirement?.double_lessons_per_week ??
                        requirement?.doubleLessonsPerWeek
                    );


                const maxLessonsPerDay =
                    Number(
                        requirement?.max_lessons_per_day ??
                        requirement?.maxLessonsPerDay
                    );


                const parallelGroupSize =
                    Number(
                        requirement?.parallel_group_size ??
                        requirement?.parallelGroupSize
                    );


                const parallelGroup =
                    normalizeParallelGroupKey(
                        requirement?.parallel_group ??
                        requirement?.parallelGroup
                    );


                return {

                    // ------------------------------------------------
                    // PRESERVE ORIGINAL DATABASE FIELDS
                    // ------------------------------------------------

                    ...requirement,


                    // ------------------------------------------------
                    // NORMALIZED IDENTITY
                    // ------------------------------------------------

                    requirementId:
                        requirement?.id ??
                        requirement?.requirementId ??
                        null,

                    schoolId:
                        requirement?.school_id ??
                        requirement?.schoolId ??
                        normalized.schoolId ??
                        null,

                    streamId:
                        requirement?.stream_id ??
                        requirement?.streamId ??
                        null,

                    subjectId:
                        requirement?.subject_id ??
                        requirement?.subjectId ??
                        null,

                    teacherId:
                        requirement?.teacher_id ??
                        requirement?.teacherId ??
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
                        requirement?.requires_room === true ||
                        requirement?.requiresRoom === true,


                    roomTypeId:
                        requirement?.room_type_id ??
                        requirement?.roomTypeId ??
                        null,


                    roomType:
                        normalizeRoomType(
                            requirement?.room_type ??
                            requirement?.roomType
                        ),


                    // ------------------------------------------------
                    // PARALLEL GROUP
                    // ------------------------------------------------

                    parallelGroup,

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

                const maxLessonsPerDay =
                    Number(
                        teacher?.max_lessons_per_day ??
                        teacher?.maxLessonsPerDay
                    );


                const maxLessonsPerWeek =
                    Number(
                        teacher?.max_lessons_per_week ??
                        teacher?.maxLessonsPerWeek
                    );


                const maxConsecutiveLessons =
                    Number(
                        teacher?.max_consecutive_lessons ??
                        teacher?.maxConsecutiveLessons
                    );


                return {

                    ...teacher,

                    maxLessonsPerDay:
                        Number.isFinite(
                            maxLessonsPerDay
                        ) &&
                        maxLessonsPerDay > 0
                            ? maxLessonsPerDay
                            : 6,

                    maxLessonsPerWeek:
                        Number.isFinite(
                            maxLessonsPerWeek
                        ) &&
                        maxLessonsPerWeek > 0
                            ? maxLessonsPerWeek
                            : 30,

                    maxConsecutiveLessons:
                        Number.isFinite(
                            maxConsecutiveLessons
                        ) &&
                        maxConsecutiveLessons > 0
                            ? maxConsecutiveLessons
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

                    // ------------------------------------------------
                    // AUTHORITATIVE ROOM TYPE ID
                    // ------------------------------------------------

                    roomTypeId:
                        room?.room_type_id ??
                        room?.roomTypeId ??
                        null,


                    // ------------------------------------------------
                    // NORMALIZED ROOM TYPE
                    // ------------------------------------------------

                    roomType:
                        getTimetableRoomType(
                            room
                        ) ||
                        "classroom",


                    // ------------------------------------------------
                    // AVAILABILITY
                    // ------------------------------------------------

                    available:
                        room?.available !== false

                };

            }
        );


    // ========================================================
    // BUILD SCHOOL-WIDE PARALLEL GROUP INDEX
    // ========================================================
    //
    // IMPORTANT:
    //
    // This MUST happen AFTER requirements have been
    // normalized.
    //
    // Therefore buildParallelGroupIndex() receives:
    //
    //     requirement.requirementId
    //     requirement.streamId
    //     requirement.subjectId
    //     requirement.teacherId
    //     requirement.parallelGroup
    //
    // in their normalized form.
    //
    // ========================================================

    normalized.parallelGroups =
        buildParallelGroupIndex(
            normalized.requirements,
            normalized.streams
        );


    // ========================================================
    // REBUILD LOOKUP MAPS
    // ========================================================
    //
    // Rooms are already normalized before this point.
    //
    // ========================================================

    normalized.lookup =
        buildTimetableLookupMaps(
            normalized
        );


    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
        "======================================"
    );

    console.log(
        "GENERATOR DATA NORMALIZED"
    );

    console.log(
        "======================================"
    );

    console.log(
        "Normalized requirements:",
        normalized.requirements.length
    );

    console.log(
        "Normalized periods:",
        normalized.periods.length
    );

    console.log(
        "Normalized streams:",
        normalized.streams.length
    );

    console.log(
        "Normalized subjects:",
        normalized.subjects.length
    );

    console.log(
        "Normalized teachers:",
        normalized.teachers.length
    );

    console.log(
        "Normalized rooms:",
        normalized.rooms.length
    );

    console.log(
        "School-wide parallel groups:",
        normalized.parallelGroups
    );

    console.log(
        "Parallel group count:",
        normalized.parallelGroups.size
    );


    return normalized;

}




// ============================================================
// VALIDATE GENERATOR RELATIONSHIPS
// ============================================================
//
// PURPOSE:
//
// Validates that the normalized generator data has valid
// relationships between:
//
//     school
//     streams
//     subjects
//     teachers
//     rooms
//     requirements
//     parallel groups
//
// IMPORTANT:
//
// Parallel groups are SCHOOL-WIDE.
//
// Therefore this function validates the complete group
// structure before lesson tasks are created.
//
// It does NOT decide the occurrence numbering.
// That responsibility belongs to createLessonTasks().
//
// ============================================================

function validateGeneratorRelationships(
    data
) {

    const errors = [];

    const warnings = [];


    // ========================================================
    // BASIC DATA VALIDATION
    // ========================================================

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

    if (
        !Array.isArray(data.requirements)
    ) {

        errors.push({

            type:
                "INVALID_REQUIREMENTS",

            message:
                "Timetable requirements are not available."

        });

    }
    else {

        data.requirements.forEach(
            requirement => {

                if (
                    !requirement ||
                    typeof requirement !== "object"
                ) {

                    errors.push({

                        type:
                            "INVALID_REQUIREMENT",

                        message:
                            "An invalid timetable requirement was supplied."

                    });

                    return;

                }


                // =================================================
                // REQUIREMENT ID
                // =================================================

                const requirementId =
                    requirement.requirementId ??
                    requirement.id ??
                    null;


                if (!requirementId) {

                    errors.push({

                        type:
                            "INVALID_REQUIREMENT",

                        message:
                            "A timetable requirement has no ID."

                    });

                    return;

                }


                // =================================================
                // SCHOOL
                // =================================================

                const requirementSchoolId =
                    requirement.schoolId ??
                    requirement.school_id ??
                    null;


                if (
                    requirementSchoolId &&
                    schoolId &&
                    String(requirementSchoolId) !==
                    String(schoolId)
                ) {

                    errors.push({

                        type:
                            "WRONG_SCHOOL",

                        requirementId,

                        message:
                            "Requirement belongs to another school."

                    });

                }


                // =================================================
                // STREAM
                // =================================================

                const streamId =
                    requirement.streamId ??
                    requirement.stream_id ??
                    null;


                if (!streamId) {

                    errors.push({

                        type:
                            "MISSING_STREAM",

                        requirementId,

                        message:
                            "Requirement has no stream assigned."

                    });

                }
                else if (
                    !data.lookup?.streams?.has(
                        streamId
                    )
                ) {

                    errors.push({

                        type:
                            "MISSING_STREAM",

                        requirementId,

                        streamId,

                        message:
                            "Requirement references a stream that does not exist."

                    });

                }


                // =================================================
                // SUBJECT
                // =================================================

                const subjectId =
                    requirement.subjectId ??
                    requirement.subject_id ??
                    null;


                if (!subjectId) {

                    errors.push({

                        type:
                            "MISSING_SUBJECT",

                        requirementId,

                        message:
                            "Requirement has no subject assigned."

                    });

                }
                else if (
                    !data.lookup?.subjects?.has(
                        subjectId
                    )
                ) {

                    errors.push({

                        type:
                            "MISSING_SUBJECT",

                        requirementId,

                        subjectId,

                        message:
                            "Requirement references a subject that does not exist."

                    });

                }


                // =================================================
                // TEACHER
                // =================================================

                const teacherId =
                    requirement.teacherId ??
                    requirement.teacher_id ??
                    null;


                if (!teacherId) {

                    warnings.push({

                        type:
                            "MISSING_TEACHER",

                        requirementId,

                        message:
                            "No teacher is assigned to this requirement."

                    });

                }
                else if (
                    !data.lookup?.teachers?.has(
                        teacherId
                    )
                ) {

                    errors.push({

                        type:
                            "MISSING_TEACHER",

                        requirementId,

                        teacherId,

                        message:
                            "Requirement references a teacher that does not exist."

                    });

                }


                // =================================================
                // LESSON COUNT
                // =================================================

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


                // =================================================
                // DOUBLE LESSON COUNT
                // =================================================

                if (
                    !Number.isFinite(
                        requirement.doubleLessonsPerWeek
                    ) ||
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
                    Number.isFinite(
                        requirement.lessonsPerWeek
                    ) &&
                    Number.isFinite(
                        requirement.doubleLessonsPerWeek
                    ) &&
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


                // =================================================
                // MAX LESSONS PER DAY
                // =================================================

                if (
                    !Number.isFinite(
                        requirement.maxLessonsPerDay
                    ) ||
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
                        Array.isArray(
                            data.rooms
                        )
                            ? data.rooms.filter(
                                room => {

                                    if (
                                        !room ||
                                        room.available === false
                                    ) {

                                        return false;

                                    }


                                    // --------------------------------
                                    // AUTHORITATIVE ROOM TYPE ID
                                    // --------------------------------

                                    if (
                                        expectedRoomTypeId
                                    ) {

                                        const actualRoomTypeId =
                                            room.roomTypeId ??
                                            room.room_type_id ??
                                            null;


                                        return (
                                            normalizeTimetableId(
                                                actualRoomTypeId
                                            ) ===
                                            expectedRoomTypeId
                                        );

                                    }


                                    // --------------------------------
                                    // TEXT FALLBACK
                                    // --------------------------------

                                    if (
                                        expectedRoomType
                                    ) {

                                        return (
                                            normalizeRoomType(
                                                getTimetableRoomType(
                                                    room
                                                )
                                            ) ===
                                            expectedRoomType
                                        );

                                    }


                                    // --------------------------------
                                    // ROOM REQUIRED WITHOUT TYPE
                                    // --------------------------------

                                    return true;

                                }
                            )
                            : [];


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

    }


    // ========================================================
    // SCHOOL-WIDE PARALLEL GROUP VALIDATION
    // ========================================================
    //
    // IMPORTANT:
    //
    // The parallel group index was already built during
    // normalizeGeneratorData().
    //
    // Here we verify that the index agrees with the actual
    // requirements.
    //
    // We do NOT create occurrence numbers here.
    //
    // ========================================================

    if (
        data.parallelGroups instanceof Map
    ) {

        data.parallelGroups.forEach(
            group => {

                if (
                    !group ||
                    !group.groupKey
                ) {

                    return;

                }


                const groupKey =
                    normalizeParallelGroupKey(
                        group.groupKey
                    );


                const requirements =
                    Array.isArray(
                        group.requirements
                    )
                        ? group.requirements
                        : [];


                const streamIds =
                    group.streamIds instanceof Set
                        ? [...group.streamIds]
                        : Array.isArray(
                            group.streamIdList
                        )
                            ? [...group.streamIdList]
                            : [];


                // =================================================
                // EMPTY GROUP
                // =================================================

                if (
                    requirements.length === 0
                ) {

                    warnings.push({

                        type:
                            "EMPTY_PARALLEL_GROUP",

                        parallelGroup:
                            groupKey,

                        message:
                            "Parallel group exists but contains no requirements."

                    });

                    return;

                }


                // =================================================
                // SINGLE STREAM GROUP
                // =================================================

                if (
                    streamIds.length < 2
                ) {

                    warnings.push({

                        type:
                            "SINGLE_STREAM_PARALLEL_GROUP",

                        parallelGroup:
                            groupKey,

                        streamCount:
                            streamIds.length,

                        message:
                            "Parallel group currently contains fewer than two participating streams."

                    });

                }


                // =================================================
                // VERIFY REQUIREMENTS BELONG TO GROUP
                // =================================================

                requirements.forEach(
                    requirement => {

                        const requirementGroup =
                            normalizeParallelGroupKey(
                                requirement?.parallelGroup ??
                                requirement?.parallel_group
                            );


                        if (
                            requirementGroup !==
                            groupKey
                        ) {

                            errors.push({

                                type:
                                    "PARALLEL_GROUP_INDEX_MISMATCH",

                                parallelGroup:
                                    groupKey,

                                requirementId:
                                    requirement?.requirementId ??
                                    requirement?.id ??
                                    null,

                                message:
                                    "A requirement in the parallel-group index does not contain the same normalized parallel-group key."

                            });

                        }

                    }
                );


                // =================================================
                // VERIFY STREAM MEMBERSHIP
                // =================================================

                const requirementsByStream =
                    new Map();


                requirements.forEach(
                    requirement => {

                        const streamId =
                            requirement?.streamId ??
                            requirement?.stream_id ??
                            null;


                        if (!streamId) {

                            return;

                        }


                        const normalizedStreamId =
                            String(streamId);


                        if (
                            !requirementsByStream.has(
                                normalizedStreamId
                            )
                        ) {

                            requirementsByStream.set(
                                normalizedStreamId,
                                []
                            );

                        }


                        requirementsByStream
                            .get(
                                normalizedStreamId
                            )
                            .push(
                                requirement
                            );

                    }
                );


                requirementsByStream.forEach(
                    (
                        streamRequirements,
                        streamId
                    ) => {

                        if (
                            !streamIds.includes(
                                streamId
                            )
                        ) {

                            errors.push({

                                type:
                                    "PARALLEL_STREAM_INDEX_MISMATCH",

                                parallelGroup:
                                    groupKey,

                                streamId,

                                message:
                                    "A stream contains a parallel-group requirement but is missing from the parallel-group stream index."

                            });

                        }

                    }
                );


                // =================================================
                // LESSON COUNT ANALYSIS
                // =================================================
                //
                // We do NOT silently synchronize only the
                // matching portion.
                //
                // We simply identify unequal requirements here.
                //
                // createLessonTasks() will determine the actual
                // school-wide occurrence structure.
                //
                // =================================================

                const lessonCounts =
                    requirements.map(
                        requirement => ({

                            requirementId:
                                requirement?.requirementId ??
                                requirement?.id ??
                                null,

                            streamId:
                                requirement?.streamId ??
                                requirement?.stream_id ??
                                null,

                            subjectId:
                                requirement?.subjectId ??
                                requirement?.subject_id ??
                                null,

                            lessonsPerWeek:
                                Number(
                                    requirement?.lessonsPerWeek
                                ) || 0,

                            doubleLessonsPerWeek:
                                Number(
                                    requirement?.doubleLessonsPerWeek
                                ) || 0

                        })
                    );


                const uniqueLessonCounts =
                    new Set(
                        lessonCounts.map(
                            item =>
                                item.lessonsPerWeek
                        )
                    );


                if (
                    uniqueLessonCounts.size > 1
                ) {

                    warnings.push({

                        type:
                            "PARALLEL_GROUP_LESSON_COUNT_MISMATCH",

                        parallelGroup:
                            groupKey,

                        lessonCounts,

                        message:
                            "Requirements in this parallel group have different lessons-per-week totals. The task-generation stage must establish a school-wide occurrence structure rather than independently numbering occurrences per stream."

                    });

                }


                // =================================================
                // DOUBLE LESSON ANALYSIS
                // =================================================

                const doubleLessonCounts =
                    new Set(
                        lessonCounts.map(
                            item =>
                                item.doubleLessonsPerWeek
                        )
                    );


                if (
                    doubleLessonCounts.size > 1
                ) {

                    warnings.push({

                        type:
                            "PARALLEL_GROUP_DOUBLE_COUNT_MISMATCH",

                        parallelGroup:
                            groupKey,

                        lessonCounts,

                        message:
                            "Requirements in this parallel group have different double-lesson counts. The task-generation stage must preserve a consistent school-wide occurrence identity."

                    });

                }


                // =================================================
                // STREAM SUMMARY
                // =================================================

                console.log(
                    "Parallel group validation:",
                    {

                        parallelGroup:
                            groupKey,

                        streamCount:
                            streamIds.length,

                        streams:
                            streamIds,

                        requirementCount:
                            requirements.length,

                        lessonCounts

                    }
                );

            }
        );

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


    if (
        errors.length > 0
    ) {

        console.error(
            "Generator relationship errors:",
            errors
        );

    }


    if (
        warnings.length > 0
    ) {

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
// GENERATOR DATA PREPARATION PIPELINE
// STAGE 2 → STAGE 3 HANDOFF
// ============================================================
//
// PIPELINE:
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
// IMPORTANT:
//
// parallelGroups is passed directly into createLessonTasks().
//
// This means lesson-task generation has access to the COMPLETE
// SCHOOL-WIDE parallel-group membership before occurrence
// numbers are created.
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
                        typeof error === "string"
                            ? error
                            : error.message
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
    //
    // IMPORTANT:
    //
    // createLessonTasks() receives:
    //
    //     1. ALL normalized requirements
    //     2. ALL lookup maps
    //     3. The COMPLETE school-wide parallelGroups Map
    //
    // This is critical.
    //
    // The task creator must NOT independently reset parallel
    // occurrence numbering for every requirement.
    //
    // Instead, the parallel group itself will determine the
    // school-wide occurrence identity.
    //
    // ========================================================

    const lessonTasks =
        createLessonTasks(
            normalizedData.requirements,
            normalizedData.lookup,
            normalizedData.parallelGroups
        );


    // ========================================================
    // SAFETY CHECK
    // ========================================================

    if (
        !Array.isArray(
            lessonTasks
        )
    ) {

        throw new Error(
            "createLessonTasks() did not return a valid task array."
        );

    }


    // ========================================================
    // STEP 7 — VALIDATE LESSON TASKS
    // ========================================================

    validateLessonTasks(
        normalizedData,
        lessonTasks
    );


    // ========================================================
    // STEP 8 — ATTACH TASKS
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

    generatorData.parallelGroups =
        normalizedData.parallelGroups;

    generatorData.lookup =
        normalizedData.lookup;


    // ========================================================
    // RESET PLACEMENT STATE
    // ========================================================
    //
    // A new generation must never inherit placed tasks from
    // an earlier generation.
    //
    // ========================================================

    generatorData.placedTasks =
        [];


    // ========================================================
    // SUMMARY
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
        "======================================"
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
        "School-wide parallel groups:",
        normalizedData.parallelGroups instanceof Map
            ? normalizedData.parallelGroups.size
            : 0
    );

    console.log(
        "======================================"
    );


    return normalizedData;

}

                    

   function createLessonTasks(
    requirements,
    lookup,
    parallelGroups = null
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
    // BUILD SCHOOL-WIDE PARALLEL GROUP MAP
    // ========================================================
    //
    // IMPORTANT:
    //
    // A parallel occurrence belongs to the GROUP, not to an
    // individual requirement.
    //
    // Example:
    //
    // RE/GE/BS
    //
    // O1
    // O2
    // O3
    // O4
    // O5
    //
    // Every participating stream/requirement uses these same
    // occurrence numbers.
    //
    // This is what allows Stage 6 / Stage 7 to enforce:
    //
    //     RE O3 = GE O3 = BS O3
    //
    // at the same day + period.
    //
    // ========================================================

    const parallelRequirementMap =
        new Map();


    if (
        parallelGroups instanceof Map
    ) {

        parallelGroups.forEach(
            group => {

                if (
                    !group ||
                    !group.groupKey
                ) {

                    return;

                }


                const requirementIds =
                    new Set();


                const groupRequirements =
                    Array.isArray(
                        group.requirements
                    )
                        ? group.requirements
                        : [];


                groupRequirements.forEach(
                    requirement => {

                        const requirementId =
                            requirement?.requirementId ??
                            requirement?.id ??
                            null;


                        if (
                            requirementId
                        ) {

                            requirementIds.add(
                                String(
                                    requirementId
                                )
                            );

                        }

                    }
                );


                const streamIds =
                    group.streamIds instanceof Set
                        ? new Set(
                            [
                                ...group.streamIds
                            ].map(
                                id =>
                                    String(id)
                            )
                        )
                        : new Set();


                parallelRequirementMap.set(
                    group.groupKey,
                    {
                        group,
                        requirements:
                            groupRequirements,
                        requirementIds,
                        streamIds
                    }
                );

            }
        );

    }


    // ========================================================
    // BUILD PARALLEL OCCURRENCE PLANS
    // ========================================================
    //
    // The occurrence plan is created BEFORE tasks are created.
    //
    // This is important.
    //
    // We first determine how many weekly teaching-period
    // occurrences each parallel group needs.
    //
    // Example:
    //
    // RE  = 5 lessons
    // GE  = 5 lessons
    // BS  = 5 lessons
    //
    // Group plan:
    //
    // O1
    // O2
    // O3
    // O4
    // O5
    //
    // The individual tasks then reference those group-wide
    // occurrence numbers.
    //
    // ========================================================

    const parallelOccurrencePlans =
        new Map();


    parallelRequirementMap.forEach(
        (
            groupInfo,
            groupKey
        ) => {

            const groupRequirements =
                groupInfo.requirements;


            if (
                !Array.isArray(
                    groupRequirements
                ) ||
                groupRequirements.length === 0
            ) {

                return;

            }


            let maxOccurrences =
                0;


            const requirementOccurrenceTotals =
                [];


            groupRequirements.forEach(
                requirement => {

                    const lessons =
                        Math.max(
                            0,
                            Number(
                                requirement?.lessonsPerWeek
                            ) || 0
                        );


                    maxOccurrences =
                        Math.max(
                            maxOccurrences,
                            lessons
                        );


                    requirementOccurrenceTotals.push(
                        {
                            requirementId:
                                requirement?.requirementId ??
                                requirement?.id ??
                                null,

                            streamId:
                                requirement?.streamId ??
                                requirement?.stream_id ??
                                null,

                            subjectId:
                                requirement?.subjectId ??
                                requirement?.subject_id ??
                                null,

                            lessonsPerWeek:
                                lessons
                        }
                    );

                }
            );


            const occurrences = [];


            for (
                let occurrence = 1;
                occurrence <= maxOccurrences;
                occurrence++
            ) {

                occurrences.push(
                    {
                        occurrence,
                        key:
                            `${groupKey}-O${occurrence}`
                    }
                );

            }


            parallelOccurrencePlans.set(
                groupKey,
                {
                    groupKey,

                    streamIds:
                        new Set(
                            groupInfo.streamIds
                        ),

                    requirementIds:
                        new Set(
                            groupInfo.requirementIds
                        ),

                    occurrenceCount:
                        maxOccurrences,

                    occurrences,

                    requirementOccurrenceTotals

                }
            );

        }
    );


    // ========================================================
    // PARALLEL PLAN DIAGNOSTICS
    // ========================================================

    if (
        parallelOccurrencePlans.size > 0
    ) {

        console.log(
            "======================================"
        );

        console.log(
            "PARALLEL OCCURRENCE PLANS"
        );

        console.log(
            "======================================"
        );


        parallelOccurrencePlans.forEach(
            plan => {

                console.log(
                    `Parallel group ${plan.groupKey}:`,
                    {
                        streams:
                            [
                                ...plan.streamIds
                            ],

                        requirements:
                            [
                                ...plan.requirementIds
                            ],

                        occurrenceCount:
                            plan.occurrenceCount,

                        occurrenceKeys:
                            plan.occurrences.map(
                                item =>
                                    item.key
                            ),

                        requirementTotals:
                            plan.requirementOccurrenceTotals

                    }
                );

            }
        );


        console.log(
            "======================================"
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


            // =================================================
            // PARALLEL GROUP
            // =================================================

            const parallelGroup =
                normalizeParallelGroupKey(
                    requirement.parallelGroup
                );


            const parallelGroupInfo =
                parallelGroup
                    ? parallelRequirementMap.get(
                        parallelGroup
                    )
                    : null;


            const parallelOccurrencePlan =
                parallelGroup
                    ? parallelOccurrencePlans.get(
                        parallelGroup
                    )
                    : null;


            const isParallel =
                !!(
                    parallelGroup &&
                    parallelGroupInfo &&
                    parallelOccurrencePlan
                );


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
                    isParallel
                        ? parallelGroup
                        : null,

                parallelGroupSize:
                    Number(
                        requirement.parallelGroupSize
                    ) > 0

                        ? Number(
                            requirement.parallelGroupSize
                        )

                        : (
                            parallelGroupInfo?.streamIds instanceof Set

                                ? parallelGroupInfo.streamIds.size

                                : (
                                    parallelGroupInfo?.group
                                        ?.streamIds instanceof Set

                                        ? parallelGroupInfo.group.streamIds.size

                                        : null
                                )
                        ),

                parallelGroupStreamIds:
                    isParallel

                        ? (
                            parallelGroupInfo?.streamIds instanceof Set

                                ? [
                                    ...parallelGroupInfo.streamIds
                                ]

                                : (
                                    parallelGroupInfo?.group
                                        ?.streamIds instanceof Set

                                    ? [
                                        ...parallelGroupInfo.group.streamIds
                                    ]

                                    : [
                                        String(
                                            requirement.streamId
                                        )
                                    ]
                                )
                        )

                        : [],

                parallelGroupOccurrenceCount:
                    isParallel
                        ? parallelOccurrencePlan.occurrenceCount
                        : 0,

                // =================================================
                // DAILY LIMIT
                // =================================================

                maxLessonsPerDay:
                    Number(
                        requirement.maxLessonsPerDay
                    ) || 1

            };


            // =================================================
            // SCHOOL-WIDE OCCURRENCE CURSOR
            // =================================================
            //
            // IMPORTANT:
            //
            // The number represents a TEACHING PERIOD occurrence
            // inside the parallel group.
            //
            // A double therefore consumes:
            //
            //     O1 + O2
            //
            // while another requirement may represent the same
            // two periods as:
            //
            //     O1
            //     O2
            //
            // This allows different double/single structures to
            // remain synchronized.
            //
            // =================================================

            let parallelOccurrence =
                1;


            // =================================================
            // CREATE DOUBLE TASKS
            // =================================================

            for (
                let index = 0;
                index < doubleCount;
                index++
            ) {

                const occurrenceStart =
                    parallelOccurrence;


                const occurrenceEnd =
                    parallelOccurrence + 1;


                // ------------------------------------------------
                // SAFETY: OCCURRENCE MUST EXIST IN GROUP PLAN
                // ------------------------------------------------

                if (
                    isParallel &&
                    (
                        occurrenceStart >
                        parallelOccurrencePlan.occurrenceCount ||

                        occurrenceEnd >
                        parallelOccurrencePlan.occurrenceCount
                    )
                ) {

                    throw new Error(

                        `Parallel occurrence overflow for ` +

                        `${parallelGroup}. ` +

                        `Requirement ` +

                        `${requirement.requirementId} ` +

                        `attempted to create ` +

                        `O${occurrenceStart}/O${occurrenceEnd}, ` +

                        `but the group plan contains only ` +

                        `${parallelOccurrencePlan.occurrenceCount} ` +

                        `occurrences.`

                    );

                }


                const occurrenceKey =
                    isParallel
                        ? `${parallelGroup}-O${occurrenceStart}`
                        : null;


                const task = {

                    ...commonTaskData,

                    taskId:
                        `${requirement.requirementId}-D${index + 1}`,

                    taskType:
                        "double",

                    duration:
                        2,

                    sequence:
                        index + 1,

                    // ------------------------------------------------
                    // Parallel occurrence identity
                    // ------------------------------------------------

                    parallelOccurrenceStart:
                        isParallel
                            ? occurrenceStart
                            : null,

                    parallelOccurrenceEnd:
                        isParallel
                            ? occurrenceEnd
                            : null,

                    parallelOccurrenceIndexes:
                        isParallel
                            ? [
                                occurrenceStart,
                                occurrenceEnd
                            ]
                            : [],

                    parallelOccurrenceKey:
                        occurrenceKey,

                    // ------------------------------------------------
                    // Task sequence
                    // ------------------------------------------------
                    //
                    // This describes the local task type.
                    //
                    // Synchronization MUST use
                    // parallelOccurrenceKey, not this value.
                    //
                    // ------------------------------------------------

                    parallelTaskSequence:
                        isParallel
                            ? `D${index + 1}`
                            : null,

                    parallelOccurrencePosition:
                        isParallel
                            ? occurrenceStart
                            : null,

                    placed:
                        false,

                    periodIds:
                        [],

                    roomId:
                        null

                };


                tasks.push(
                    task
                );


                // ------------------------------------------------
                // A double consumes TWO school-wide occurrences.
                // ------------------------------------------------

                parallelOccurrence += 2;

            }


            // =================================================
            // CREATE SINGLE TASKS
            // =================================================

            for (
                let index = 0;
                index < singleCount;
                index++
            ) {

                const occurrence =
                    parallelOccurrence;


                // ------------------------------------------------
                // SAFETY: OCCURRENCE MUST EXIST IN GROUP PLAN
                // ------------------------------------------------

                if (
                    isParallel &&
                    occurrence >
                    parallelOccurrencePlan.occurrenceCount
                ) {

                    throw new Error(

                        `Parallel occurrence overflow for ` +

                        `${parallelGroup}. ` +

                        `Requirement ` +

                        `${requirement.requirementId} ` +

                        `attempted to create ` +

                        `O${occurrence}, ` +

                        `but the group plan contains only ` +

                        `${parallelOccurrencePlan.occurrenceCount} ` +

                        `occurrences.`

                    );

                }


                const occurrenceKey =
                    isParallel
                        ? `${parallelGroup}-O${occurrence}`
                        : null;


                const task = {

                    ...commonTaskData,

                    taskId:
                        `${requirement.requirementId}-S${index + 1}`,

                    taskType:
                        "single",

                    duration:
                        1,

                    sequence:
                        index + 1,

                    // ------------------------------------------------
                    // Parallel occurrence identity
                    // ------------------------------------------------

                    parallelOccurrenceStart:
                        isParallel
                            ? occurrence
                            : null,

                    parallelOccurrenceEnd:
                        isParallel
                            ? occurrence
                            : null,

                    parallelOccurrenceIndexes:
                        isParallel
                            ? [
                                occurrence
                            ]
                            : [],

                    parallelOccurrenceKey:
                        occurrenceKey,

                    parallelTaskSequence:
                        isParallel
                            ? `S${index + 1}`
                            : null,

                    parallelOccurrencePosition:
                        isParallel
                            ? occurrence
                            : null,

                    placed:
                        false,

                    periodIds:
                        [],

                    roomId:
                        null

                };


                tasks.push(
                    task
                );


                parallelOccurrence++;

            }


            // =================================================
            // REQUIREMENT COVERAGE CHECK
            // =================================================
            //
            // The total occurrence consumption must equal the
            // weekly lesson requirement.
            //
            // This is also a useful protection against future
            // changes to double/single generation.
            //
            // =================================================

            if (
                isParallel
            ) {

                const generatedOccurrences =
                    parallelOccurrence - 1;


                if (
                    generatedOccurrences !==
                    lessonsPerWeek
                ) {

                    console.warn(
                        "Parallel occurrence coverage mismatch:",
                        {
                            parallelGroup,
                            requirementId:
                                requirement.requirementId,
                            streamId:
                                requirement.streamId,
                            subjectId:
                                requirement.subjectId,
                            expected:
                                lessonsPerWeek,
                            generated:
                                generatedOccurrences
                        }
                    );

                }

            }

        }
    );


    // ========================================================
    // VERIFY SCHOOL-WIDE PARALLEL OCCURRENCE COVERAGE
    // ========================================================
    //
    // This diagnostic is intentionally done AFTER all tasks
    // have been generated.
    //
    // For every parallel group we can now see which stream /
    // requirement has which occurrence.
    //
    // Example:
    //
    // RE  10A -> O1 O2 O3 O4 O5
    // GE  10B -> O1 O2 O3 O4 O5
    // BS  10C -> O1 O2 O3 O4 O5
    //
    // The occurrence keys must be identical.
    //
    // ========================================================

    const parallelOccurrenceCoverage =
        new Map();


    tasks
        .filter(
            task =>
                !!task.parallelGroup
        )
        .forEach(
            task => {

                const groupKey =
                    task.parallelGroup;


                if (
                    !parallelOccurrenceCoverage.has(
                        groupKey
                    )
                ) {

                    parallelOccurrenceCoverage.set(
                        groupKey,
                        new Map()
                    );

                }


                const groupCoverage =
                    parallelOccurrenceCoverage.get(
                        groupKey
                    );


                const requirementKey =
                    String(
                        task.requirementId
                    );


                if (
                    !groupCoverage.has(
                        requirementKey
                    )
                ) {

                    groupCoverage.set(
                        requirementKey,
                        {
                            requirementId:
                                task.requirementId,

                            streamId:
                                task.streamId,

                            subjectId:
                                task.subjectId,

                            occurrences:
                                new Set(),

                            tasks:
                                []

                        }
                    );

                }


                const coverage =
                    groupCoverage.get(
                        requirementKey
                    );


                if (
                    task.parallelOccurrenceKey
                ) {

                    coverage.occurrences.add(
                        task.parallelOccurrenceKey
                    );

                }


                coverage.tasks.push(
                    task
                );

            }
        );


    // ========================================================
    // COVERAGE DIAGNOSTIC
    // ========================================================

    if (
        parallelOccurrenceCoverage.size > 0
    ) {

        console.log(
            "======================================"
        );

        console.log(
            "PARALLEL OCCURRENCE COVERAGE"
        );

        console.log(
            "======================================"
        );


        parallelOccurrenceCoverage.forEach(
            (
                groupCoverage,
                groupKey
            ) => {

                console.log(
                    `GROUP: ${groupKey}`
                );


                groupCoverage.forEach(
                    coverage => {

                        console.log(
                            {
                                requirementId:
                                    coverage.requirementId,

                                streamId:
                                    coverage.streamId,

                                subjectId:
                                    coverage.subjectId,

                                occurrences:
                                    [
                                        ...coverage.occurrences
                                    ].sort(
                                        (
                                            a,
                                            b
                                        ) => {

                                            const aNumber =
                                                Number(
                                                    String(a)
                                                        .split("-O")
                                                        .pop()
                                                ) || 0;

                                            const bNumber =
                                                Number(
                                                    String(b)
                                                        .split("-O")
                                                        .pop()
                                                ) || 0;

                                            return (
                                                aNumber -
                                                bNumber
                                            );

                                        }
                                    )

                            }
                        );

                    }
                );

            }
        );


        console.log(
            "======================================"
        );

    }


    // ========================================================
    // HARD TASKS FIRST
    // ========================================================
    //
    // IMPORTANT CHANGE:
    //
    // Parallel tasks are primarily ordered by their
    // SCHOOL-WIDE occurrence.
    //
    // We do NOT simply put every double in the entire timetable
    // ahead of every single.
    //
    // That old ordering could cause:
    //
    //     Group O1 double
    //     Group O2 double
    //     Group O1 single
    //
    // which makes the generator work on different occurrences
    // in a fragmented order.
    //
    // The new order keeps each parallel occurrence together.
    //
    // ========================================================

    tasks.sort(
        (
            a,
            b
        ) => {

            const aParallel =
                !!a.parallelGroup;


            const bParallel =
                !!b.parallelGroup;


            // ------------------------------------------------
            // Parallel tasks first
            // ------------------------------------------------

            if (
                aParallel !==
                bParallel
            ) {

                return aParallel
                    ? -1
                    : 1;

            }


            // ------------------------------------------------
            // SAME PARALLEL GROUP
            // ------------------------------------------------

            if (
                aParallel &&
                bParallel &&
                a.parallelGroup ===
                b.parallelGroup
            ) {

                const occurrenceA =
                    Number(
                        a.parallelOccurrenceStart
                    ) || 0;


                const occurrenceB =
                    Number(
                        b.parallelOccurrenceStart
                    ) || 0;


                // --------------------------------------------
                // Same school-wide occurrence together
                // --------------------------------------------

                if (
                    occurrenceA !==
                    occurrenceB
                ) {

                    return (
                        occurrenceA -
                        occurrenceB
                    );

                }


                // --------------------------------------------
                // For the SAME occurrence:
                //
                // doubles first, then singles.
                //
                // This helps establish the common period/block
                // before the single members are placed.
                // --------------------------------------------

                if (
                    a.duration !==
                    b.duration
                ) {

                    return (
                        b.duration -
                        a.duration
                    );

                }


                // --------------------------------------------
                // Room-required before non-room-required
                // --------------------------------------------

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


            // ------------------------------------------------
            // NORMAL NON-PARALLEL TASKS
            // ------------------------------------------------

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


    const parallelTasks =
        tasks.filter(
            task =>
                !!task.parallelGroup
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
        "Parallel-group tasks:",
        parallelTasks
    );

    console.log(
        "Parallel groups:",
        parallelOccurrencePlans.size
    );

    console.log(
        "Total teaching periods required:",
        totalPeriods
    );

    console.log(
        "======================================"
    );


    // ========================================================
    // SCHOOL-WIDE PARALLEL DIAGNOSTIC TABLE
    // ========================================================

    const parallelDiagnosticRows =
        tasks
            .filter(
                task =>
                    !!task.parallelGroup
            )
            .map(
                task => ({

                    taskId:
                        task.taskId,

                    requirementId:
                        task.requirementId,

                    stream:
                        getTimetableStreamName(
                            lookup.streams.get(
                                task.streamId
                            )
                        ),

                    streamId:
                        task.streamId,

                    subject:
                        getTimetableSubjectName(
                            lookup.subjects.get(
                                task.subjectId
                            )
                        ),

                    subjectId:
                        task.subjectId,

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

                    parallelGroup:
                        task.parallelGroup,

                    parallelGroupSize:
                        task.parallelGroupSize,

                    parallelGroupOccurrenceCount:
                        task.parallelGroupOccurrenceCount,

                    occurrenceStart:
                        task.parallelOccurrenceStart,

                    occurrenceEnd:
                        task.parallelOccurrenceEnd,

                    occurrenceKey:
                        task.parallelOccurrenceKey,

                    taskSequence:
                        task.parallelTaskSequence

                })
            );


    if (
        parallelDiagnosticRows.length > 0
    ) {

        console.log(
            "======================================"
        );

        console.log(
            "SCHOOL-WIDE PARALLEL OCCURRENCES"
        );

        console.log(
            "======================================"
        );

        console.table(
            parallelDiagnosticRows
        );

        console.log(
            "======================================"
        );

    }


    // ========================================================
    // FULL TASK TABLE
    // ========================================================

    console.table(
        tasks.map(
            task => ({

                taskId:
                    task.taskId,

                requirementId:
                    task.requirementId,

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

                parallelGroupOccurrenceCount:
                    task.parallelGroupOccurrenceCount,

                parallelOccurrenceStart:
                    task.parallelOccurrenceStart,

                parallelOccurrenceEnd:
                    task.parallelOccurrenceEnd,

                parallelOccurrenceKey:
                    task.parallelOccurrenceKey,

                parallelOccurrencePosition:
                    task.parallelOccurrencePosition,

                parallelTaskSequence:
                    task.parallelTaskSequence,

                maxPerDay:
                    task.maxLessonsPerDay

            })
        )
    );


    return tasks;

}




function validateLessonTasks(
    data,
    tasks
) {

    const errors = [];
    const warnings = [];


    // ========================================================
    // BASIC INPUT VALIDATION
    // ========================================================

    if (
        !Array.isArray(tasks)
    ) {

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


    if (
        !data ||
        !Array.isArray(data.requirements)
    ) {

        errors.push(
            "Generator requirements are unavailable for lesson-task validation."
        );

        return {
            valid: false,
            errors,
            warnings
        };

    }


    // ========================================================
    // TRACK PERIOD TOTALS BY REQUIREMENT
    // ========================================================

    const requirementTotals =
        new Map();


    const taskIds =
        new Set();


    // ========================================================
    // TRACK PARALLEL OCCURRENCES
    // ========================================================

    const parallelGroups =
        new Map();


    // ========================================================
    // PROCESS TASKS
    // ========================================================

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


            // ------------------------------------------------
            // SINGLE CONSISTENCY
            // ------------------------------------------------

            if (
                task.taskType === "single" &&
                task.duration !== 1
            ) {

                errors.push(
                    `Single task ${task.taskId} must have duration 1.`
                );

            }


            // ------------------------------------------------
            // PERIOD IDS
            // ------------------------------------------------

            if (
                !Array.isArray(
                    task.periodIds
                )
            ) {

                errors.push(
                    `Task ${task.taskId || "[unknown]"} must have a periodIds array.`
                );

            }


            // ------------------------------------------------
            // REQUIREMENT TOTAL
            // ------------------------------------------------

            if (
                task.requirementId
            ) {

                const current =
                    requirementTotals.get(
                        String(
                            task.requirementId
                        )
                    ) || 0;


                requirementTotals.set(
                    String(
                        task.requirementId
                    ),
                    current +
                    (
                        Number(
                            task.duration
                        ) || 0
                    )
                );

            }


            // =================================================
            // PARALLEL TASK VALIDATION
            // =================================================

            const parallelGroup =
                normalizeParallelGroupKey(
                    task.parallelGroup ??
                    task.parallel_group
                );


            // ------------------------------------------------
            // NON-PARALLEL TASK
            // ------------------------------------------------

            if (
                !parallelGroup
            ) {

                if (
                    task.parallelOccurrenceKey
                ) {

                    errors.push(
                        `Non-parallel task ${task.taskId} has a parallel occurrence key.`
                    );

                }


                if (
                    task.parallelOccurrenceStart !== null &&
                    task.parallelOccurrenceStart !== undefined
                ) {

                    errors.push(
                        `Non-parallel task ${task.taskId} has a parallel occurrence start.`
                    );

                }


                if (
                    task.parallelOccurrenceEnd !== null &&
                    task.parallelOccurrenceEnd !== undefined
                ) {

                    errors.push(
                        `Non-parallel task ${task.taskId} has a parallel occurrence end.`
                    );

                }


                return;

            }


            // ------------------------------------------------
            // PARALLEL OCCURRENCE KEY
            // ------------------------------------------------

            const occurrenceKey =
                String(
                    task.parallelOccurrenceKey ??
                    task.parallel_occurrence_key ??
                    ""
                ).trim();


            if (
                !occurrenceKey
            ) {

                errors.push(
                    `Parallel task ${task.taskId} has no parallel occurrence key.`
                );

                return;

            }


            // ------------------------------------------------
            // PARALLEL GROUP STREAM MEMBERS
            // ------------------------------------------------

            if (
                !Array.isArray(
                    task.parallelGroupStreamIds
                ) ||
                task.parallelGroupStreamIds.length === 0
            ) {

                errors.push(
                    `Parallel task ${task.taskId} has no parallel group stream IDs.`
                );

            }


            // ------------------------------------------------
            // OCCURRENCE START
            // ------------------------------------------------

            const occurrenceStart =
                Number(
                    task.parallelOccurrenceStart
                );


            if (
                !Number.isInteger(
                    occurrenceStart
                ) ||
                occurrenceStart <= 0
            ) {

                errors.push(
                    `Parallel task ${task.taskId} has an invalid parallel occurrence start.`
                );

            }


            // ------------------------------------------------
            // OCCURRENCE END
            // ------------------------------------------------

            const occurrenceEnd =
                Number(
                    task.parallelOccurrenceEnd
                );


            if (
                !Number.isInteger(
                    occurrenceEnd
                ) ||
                occurrenceEnd <= 0
            ) {

                errors.push(
                    `Parallel task ${task.taskId} has an invalid parallel occurrence end.`
                );

            }


            // ------------------------------------------------
            // OCCURRENCE RANGE VALIDATION
            // ------------------------------------------------

            if (
                Number.isInteger(
                    occurrenceStart
                ) &&
                Number.isInteger(
                    occurrenceEnd
                )
            ) {

                if (
                    occurrenceEnd <
                    occurrenceStart
                ) {

                    errors.push(
                        `Parallel task ${task.taskId}: occurrence end O${occurrenceEnd} cannot be before occurrence start O${occurrenceStart}.`
                    );

                }


                const occurrenceSpan =
                    occurrenceEnd -
                    occurrenceStart +
                    1;


                if (
                    occurrenceSpan !==
                    task.duration
                ) {

                    errors.push(
                        `Parallel task ${task.taskId}: ` +
                        `occurrence range O${occurrenceStart}-O${occurrenceEnd} ` +
                        `does not match duration ${task.duration}.`
                    );

                }

            }


            // ------------------------------------------------
            // OCCURRENCE INDEX ARRAY
            // ------------------------------------------------

            if (
                !Array.isArray(
                    task.parallelOccurrenceIndexes
                )
            ) {

                errors.push(
                    `Parallel task ${task.taskId} has no parallel occurrence indexes.`
                );

            }
            else {

                if (
                    task.parallelOccurrenceIndexes.length !==
                    task.duration
                ) {

                    errors.push(
                        `Parallel task ${task.taskId}: ` +
                        `parallel occurrence index count ` +
                        `${task.parallelOccurrenceIndexes.length} ` +
                        `does not match duration ${task.duration}.`
                    );

                }


                for (
                    let index = 0;
                    index <
                    task.parallelOccurrenceIndexes.length;
                    index++
                ) {

                    const expectedOccurrence =
                        occurrenceStart +
                        index;


                    const actualOccurrence =
                        Number(
                            task.parallelOccurrenceIndexes[index]
                        );


                    if (
                        actualOccurrence !==
                        expectedOccurrence
                    ) {

                        errors.push(
                            `Parallel task ${task.taskId}: ` +
                            `occurrence index ${actualOccurrence} ` +
                            `does not match expected O${expectedOccurrence}.`
                        );

                    }

                }

            }


            // ------------------------------------------------
            // OCCURRENCE KEY FORMAT
            // ------------------------------------------------

            const expectedOccurrenceKey =
                `${parallelGroup}-O${occurrenceStart}`;


            if (
                occurrenceKey !==
                expectedOccurrenceKey
            ) {

                errors.push(
                    `Parallel task ${task.taskId}: ` +
                    `occurrence key ${occurrenceKey} ` +
                    `does not match expected ${expectedOccurrenceKey}.`
                );

            }


            // ------------------------------------------------
            // CREATE GROUP ENTRY
            // ------------------------------------------------

            if (
                !parallelGroups.has(
                    parallelGroup
                )
            ) {

                parallelGroups.set(
                    parallelGroup,
                    {
                        streamIds:
                            new Set(),

                        requirementIds:
                            new Set(),

                        occurrences:
                            new Map(),

                        coveredOccurrences:
                            new Map()
                    }
                );

            }


            const groupInfo =
                parallelGroups.get(
                    parallelGroup
                );


            // ------------------------------------------------
            // RECORD STREAM
            // ------------------------------------------------

            if (
                task.streamId
            ) {

                groupInfo.streamIds.add(
                    String(
                        task.streamId
                    )
                );

            }


            // ------------------------------------------------
            // RECORD REQUIREMENT
            // ------------------------------------------------

            if (
                task.requirementId
            ) {

                groupInfo.requirementIds.add(
                    String(
                        task.requirementId
                    )
                );

            }


            // ------------------------------------------------
            // CREATE OCCURRENCE ENTRY
            // ------------------------------------------------

            if (
                !groupInfo.occurrences.has(
                    occurrenceKey
                )
            ) {

                groupInfo.occurrences.set(
                    occurrenceKey,
                    {
                        occurrenceStart:
                            occurrenceStart,

                        occurrenceEnd:
                            occurrenceEnd,

                        requirements:
                            new Map(),

                        streams:
                            new Set(),

                        tasks:
                            []
                    }
                );

            }


            const occurrenceInfo =
                groupInfo.occurrences.get(
                    occurrenceKey
                );


            // ------------------------------------------------
            // CHECK SAME OCCURRENCE RANGE
            // ------------------------------------------------

            if (
                occurrenceInfo.occurrenceStart !==
                occurrenceStart ||
                occurrenceInfo.occurrenceEnd !==
                occurrenceEnd
            ) {

                errors.push(
                    `Parallel group ${parallelGroup}: ` +
                    `occurrence key ${occurrenceKey} has inconsistent occurrence ranges.`
                );

            }


            // ------------------------------------------------
            // RECORD COVERED OCCURRENCES
            // ------------------------------------------------
            //
            // IMPORTANT:
            //
            // A double lesson O1-O2 covers BOTH O1 and O2.
            //
            // Therefore continuity must be checked against the
            // complete covered range, not merely the start values.
            //
            // ------------------------------------------------

            if (
                Number.isInteger(
                    occurrenceStart
                ) &&
                Number.isInteger(
                    occurrenceEnd
                ) &&
                occurrenceEnd >= occurrenceStart
            ) {

                for (
                    let occurrence =
                        occurrenceStart;

                    occurrence <=
                    occurrenceEnd;

                    occurrence++
                ) {

                    if (
                        !groupInfo.coveredOccurrences.has(
                            occurrence
                        )
                    ) {

                        groupInfo.coveredOccurrences.set(
                            occurrence,
                            []
                        );

                    }


                    groupInfo.coveredOccurrences
                        .get(
                            occurrence
                        )
                        .push(
                            task
                        );

                }

            }


            // ------------------------------------------------
            // RECORD STREAM
            // ------------------------------------------------

            if (
                task.streamId
            ) {

                occurrenceInfo.streams.add(
                    String(
                        task.streamId
                    )
                );

            }


            // ------------------------------------------------
            // RECORD TASK
            // ------------------------------------------------

            occurrenceInfo.tasks.push(
                task
            );


            // ------------------------------------------------
            // RECORD REQUIREMENT
            // ------------------------------------------------

            const requirementKey =
                String(
                    task.requirementId
                );


            if (
                !occurrenceInfo.requirements.has(
                    requirementKey
                )
            ) {

                occurrenceInfo.requirements.set(
                    requirementKey,
                    {
                        requirementId:
                            task.requirementId,

                        streamId:
                            task.streamId,

                        subjectId:
                            task.subjectId,

                        tasks:
                            []
                    }
                );

            }


            occurrenceInfo.requirements
                .get(
                    requirementKey
                )
                .tasks
                .push(
                    task
                );

        }
    );


    // ========================================================
    // COMPARE TASK TOTALS WITH REQUIREMENTS
    // ========================================================

    data.requirements.forEach(
        requirement => {

            const requirementId =
                requirement.requirementId ??
                requirement.id ??
                null;


            if (
                !requirementId
            ) {

                errors.push(
                    "A generator requirement has no requirement ID."
                );

                return;

            }


            const expected =
                Number(
                    requirement.lessonsPerWeek
                ) || 0;


            const actual =
                requirementTotals.get(
                    String(
                        requirementId
                    )
                ) || 0;


            if (
                expected !==
                actual
            ) {

                errors.push(
                    `Requirement ${requirementId}: ` +
                    `expected ${expected} teaching periods ` +
                    `but generated ${actual}.`
                );

            }

        }
    );


    // ========================================================
    // VALIDATE SCHOOL-WIDE PARALLEL GROUPS
    // ========================================================

    parallelGroups.forEach(
        (
            groupInfo,
            groupKey
        ) => {

            // ------------------------------------------------
            // DETERMINE EXPECTED GROUP MEMBERS
            // ------------------------------------------------

            const expectedStreamIds =
                new Set();


            const expectedRequirementIds =
                new Set();


            // ------------------------------------------------
            // GET AUTHORITATIVE GROUP DEFINITION
            // ------------------------------------------------

            let authoritativeGroup =
                null;


            if (
                data.parallelGroups instanceof Map
            ) {

                authoritativeGroup =
                    data.parallelGroups.get(
                        groupKey
                    );

            }


            if (
                authoritativeGroup
            ) {

                if (
                    authoritativeGroup.streamIds instanceof Set
                ) {

                    authoritativeGroup.streamIds.forEach(
                        streamId => {

                            expectedStreamIds.add(
                                String(
                                    streamId
                                )
                            );

                        }
                    );

                }


                if (
                    authoritativeGroup.requirementIds instanceof Set
                ) {

                    authoritativeGroup.requirementIds.forEach(
                        requirementId => {

                            expectedRequirementIds.add(
                                String(
                                    requirementId
                                )
                            );

                        }
                    );

                }
                else if (
                    Array.isArray(
                        authoritativeGroup.requirements
                    )
                ) {

                    authoritativeGroup.requirements.forEach(
                        requirement => {

                            const requirementId =
                                requirement?.requirementId ??
                                requirement?.id ??
                                null;


                            if (
                                requirementId
                            ) {

                                expectedRequirementIds.add(
                                    String(
                                        requirementId
                                    )
                                );

                            }

                        }
                    );

                }

            }


            // ------------------------------------------------
            // FALL BACK TO GENERATED MEMBERSHIP
            // ------------------------------------------------

            if (
                expectedStreamIds.size === 0
            ) {

                groupInfo.streamIds.forEach(
                    streamId => {

                        expectedStreamIds.add(
                            String(
                                streamId
                            )
                        );

                    }
                );

            }


            if (
                expectedRequirementIds.size === 0
            ) {

                groupInfo.requirementIds.forEach(
                    requirementId => {

                        expectedRequirementIds.add(
                            String(
                                requirementId
                            )
                        );

                    }
                );

            }


            // ------------------------------------------------
            // VALIDATE EVERY OCCURRENCE ENTRY
            // ------------------------------------------------

            groupInfo.occurrences.forEach(
                (
                    occurrenceInfo,
                    occurrenceKey
                ) => {

                    const expectedKey =
                        `${groupKey}-O${occurrenceInfo.occurrenceStart}`;


                    if (
                        occurrenceKey !==
                        expectedKey
                    ) {

                        errors.push(
                            `Parallel group ${groupKey}: ` +
                            `invalid occurrence key ${occurrenceKey}; ` +
                            `expected ${expectedKey}.`
                        );

                    }


                    // ----------------------------------------
                    // REQUIRED STREAM MEMBERS
                    // ----------------------------------------

                    expectedStreamIds.forEach(
                        streamId => {

                            if (
                                !occurrenceInfo.streams.has(
                                    streamId
                                )
                            ) {

                                errors.push(
                                    `Parallel group ${groupKey}, ` +
                                    `${occurrenceKey}: ` +
                                    `stream ${streamId} is missing ` +
                                    `from the school-wide occurrence.`
                                );

                            }

                        }
                    );


                    // ----------------------------------------
                    // REQUIRED REQUIREMENT MEMBERS
                    // ----------------------------------------

                    expectedRequirementIds.forEach(
                        requirementId => {

                            if (
                                !occurrenceInfo.requirements.has(
                                    requirementId
                                )
                            ) {

                                errors.push(
                                    `Parallel group ${groupKey}, ` +
                                    `${occurrenceKey}: ` +
                                    `requirement ${requirementId} is missing ` +
                                    `from the school-wide occurrence.`
                                );

                            }

                        }
                    );


                    // ----------------------------------------
                    // NO UNEXPECTED STREAM
                    // ----------------------------------------

                    occurrenceInfo.streams.forEach(
                        streamId => {

                            if (
                                expectedStreamIds.size > 0 &&
                                !expectedStreamIds.has(
                                    String(
                                        streamId
                                    )
                                )
                            ) {

                                errors.push(
                                    `Parallel group ${groupKey}, ` +
                                    `${occurrenceKey}: ` +
                                    `unexpected stream ${streamId} ` +
                                    `was assigned to the occurrence.`
                                );

                            }

                        }
                    );

                }
            );


            // =================================================
            // CHECK FULL OCCURRENCE CONTINUITY
            // =================================================
            //
            // DO NOT check only occurrenceStart values.
            //
            // Example:
            //
            //     O1-O2  double
            //     O3     single
            //
            // Start values:
            //
            //     1, 3
            //
            // That is VALID.
            //
            // Covered occurrences:
            //
            //     1, 2, 3
            //
            // That is CONTINUOUS.
            //
            // =================================================

            const coveredOccurrenceNumbers =
                [
                    ...groupInfo.coveredOccurrences.keys()
                ]
                    .map(
                        value =>
                            Number(
                                value
                            )
                    )
                    .filter(
                        value =>
                            Number.isInteger(
                                value
                            ) &&
                            value > 0
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            a - b
                    );


            const uniqueCoveredOccurrenceNumbers =
                [
                    ...new Set(
                        coveredOccurrenceNumbers
                    )
                ];


            for (
                let index = 0;
                index <
                uniqueCoveredOccurrenceNumbers.length;
                index++
            ) {

                const expected =
                    index + 1;


                const actual =
                    uniqueCoveredOccurrenceNumbers[index];


                if (
                    actual !==
                    expected
                ) {

                    errors.push(
                        `Parallel group ${groupKey}: ` +
                        `occurrence sequence is not continuous. ` +
                        `Expected O${expected} but found O${actual}.`
                    );

                    break;

                }

            }


            // ------------------------------------------------
            // CHECK FOR OVERLAPPING OCCURRENCE RANGES
            // ------------------------------------------------
            //
            // Two separate tasks belonging to the same
            // requirement should not claim the same occurrence
            // unless they are deliberately part of the same
            // occurrence representation.
            //
            // Multiple streams/requirements may legitimately
            // share the same school-wide occurrence.
            //
            // ------------------------------------------------

            groupInfo.occurrences.forEach(
                (
                    occurrenceInfo,
                    occurrenceKey
                ) => {

                    const tasksByRequirement =
                        new Map();


                    occurrenceInfo.tasks.forEach(
                        task => {

                            const requirementId =
                                String(
                                    task.requirementId
                                );


                            if (
                                !tasksByRequirement.has(
                                    requirementId
                                )
                            ) {

                                tasksByRequirement.set(
                                    requirementId,
                                    []
                                );

                            }


                            tasksByRequirement
                                .get(
                                    requirementId
                                )
                                .push(
                                    task
                                );

                        }
                    );


                    tasksByRequirement.forEach(
                        (
                            requirementTasks,
                            requirementId
                        ) => {

                            if (
                                requirementTasks.length <= 1
                            ) {

                                return;

                            }


                            // Same requirement may legitimately have
                            // multiple task records only if they are
                            // representing distinct stream members.
                            //
                            // Detect duplicate stream representation.

                            const seenStreams =
                                new Set();


                            requirementTasks.forEach(
                                task => {

                                    const streamId =
                                        String(
                                            task.streamId
                                        );


                                    if (
                                        seenStreams.has(
                                            streamId
                                        )
                                    ) {

                                        errors.push(
                                            `Parallel group ${groupKey}, ` +
                                            `${occurrenceKey}: requirement ${requirementId} ` +
                                            `contains duplicate task representation for stream ${streamId}.`
                                        );

                                    }


                                    seenStreams.add(
                                        streamId
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );


    // ========================================================
    // CHECK PARALLEL GROUP MEMBERSHIP AGAINST REQUIREMENTS
    // ========================================================

    data.requirements.forEach(
        requirement => {

            const groupKey =
                normalizeParallelGroupKey(
                    requirement.parallelGroup ??
                    requirement.parallel_group
                );


            if (
                !groupKey
            ) {

                return;

            }


            const requirementId =
                requirement.requirementId ??
                requirement.id ??
                null;


            if (
                !requirementId
            ) {

                return;

            }


            const groupInfo =
                parallelGroups.get(
                    groupKey
                );


            if (
                !groupInfo
            ) {

                errors.push(
                    `Parallel requirement ${requirementId} belongs to ` +
                    `${groupKey}, but no generated parallel tasks were found.`
                );

                return;

            }


            if (
                !groupInfo.requirementIds.has(
                    String(
                        requirementId
                    )
                )
            ) {

                errors.push(
                    `Parallel requirement ${requirementId} was not represented ` +
                    `in its generated parallel group ${groupKey}.`
                );

            }

        }
    );


    // ========================================================
    // PARALLEL OCCURRENCE DIAGNOSTIC
    // ========================================================

    if (
        parallelGroups.size > 0
    ) {

        console.log(
            "======================================"
        );

        console.log(
            "LESSON TASK PARALLEL VALIDATION"
        );

        console.log(
            "======================================"
        );


        parallelGroups.forEach(
            (
                groupInfo,
                groupKey
            ) => {

                console.log(
                    `GROUP: ${groupKey}`
                );


                groupInfo.occurrences.forEach(
                    (
                        occurrenceInfo,
                        occurrenceKey
                    ) => {

                        console.log(
                            occurrenceKey,
                            {
                                occurrenceStart:
                                    occurrenceInfo.occurrenceStart,

                                occurrenceEnd:
                                    occurrenceInfo.occurrenceEnd,

                                streams:
                                    [
                                        ...occurrenceInfo.streams
                                    ],

                                requirements:
                                    [
                                        ...occurrenceInfo.requirements.keys()
                                    ],

                                tasks:
                                    occurrenceInfo.tasks.map(
                                        task => ({
                                            taskId:
                                                task.taskId,

                                            streamId:
                                                task.streamId,

                                            subjectId:
                                                task.subjectId,

                                            taskType:
                                                task.taskType,

                                            duration:
                                                task.duration,

                                            parallelOccurrenceStart:
                                                task.parallelOccurrenceStart,

                                            parallelOccurrenceEnd:
                                                task.parallelOccurrenceEnd,

                                            parallelOccurrenceIndexes:
                                                task.parallelOccurrenceIndexes
                                        })
                                    )

                            }
                        );

                    }
                );


                console.log(
                    "Covered occurrences:",
                    [
                        ...groupInfo.coveredOccurrences.keys()
                    ].sort(
                        (
                            a,
                            b
                        ) =>
                            Number(a) -
                            Number(b)
                    )
                );

            }
        );


        console.log(
            "======================================"
        );

    }


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


        if (
            warnings.length > 0
        ) {

            console.warn(
                "LESSON TASK VALIDATION WARNINGS:",
                warnings
            );

        }


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


    if (
        warnings.length > 0
    ) {

        console.warn(
            "Lesson task validation warnings:",
            warnings
        );

    }


    return true;

}





// ============================================================
// SHUFFLE ARRAY
// ============================================================

function shuffleArray(
    array
) {

    if (
        !Array.isArray(array)
    ) {

        return [];

    }


    const result =
        [...array];


    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            result[i],
            result[j]
        ] =
        [
            result[j],
            result[i]
        ];

    }


    return result;

}


// ============================================================
// NORMALIZE ID
// ============================================================

function normalizeTimetableId(
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

    const firstDay =
        Number(
            first.dayNumber
        );


    const secondDay =
        Number(
            second.dayNumber
        );


    if (
        !Number.isFinite(firstDay) ||
        !Number.isFinite(secondDay)
    ) {

        return false;

    }


    if (
        firstDay !==
        secondDay
    ) {

        return false;

    }


    // ========================================================
    // PERIOD ORDER
    // ========================================================

    const firstOrder =
        Number(
            first.periodOrder
        );


    const secondOrder =
        Number(
            second.periodOrder
        );


    if (
        !Number.isFinite(firstOrder) ||
        !Number.isFinite(secondOrder)
    ) {

        return false;

    }


    return (
        secondOrder ===
        firstOrder + 1
    );

}


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


    return [
        ...periods
    ].sort(
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

                return (
                    dayA -
                    dayB
                );

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
//
// ROOM MATCHING RULE:
//
// 1. Room must exist.
// 2. Room must be available.
// 3. If task has roomTypeId, that ID is authoritative.
// 4. Otherwise roomType text may be used as fallback.
// 5. If task requires a room but has no type restriction,
//    any available room is compatible.
// 6. If task does not require a room, return [null].
//
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


    // ========================================================
    // NO ROOM REQUIRED
    // ========================================================

    if (
        !task ||
        task.requiresRoom !== true
    ) {

        return [
            null
        ];

    }


    // ========================================================
    // ROOM REQUIRED BUT NONE AVAILABLE
    // ========================================================

    if (
        availableRooms.length === 0
    ) {

        return [];

    }


    // ========================================================
    // AUTHORITATIVE ROOM TYPE ID
    // ========================================================

    const requestedRoomTypeId =
        task.roomTypeId ??
        task.room_type_id ??
        task.requiredRoomTypeId ??
        task.required_room_type_id ??
        null;


    const normalizedRequestedRoomTypeId =
        normalizeTimetableId(
            requestedRoomTypeId
        );


    // ========================================================
    // ROOM TYPE TEXT FALLBACK
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
                // ROOM TYPE ID IS AUTHORITATIVE
                // ------------------------------------------------

                if (
                    normalizedRequestedRoomTypeId
                ) {

                    const actualRoomTypeId =
                        room.roomTypeId ??
                        room.room_type_id ??
                        room.typeId ??
                        room.type_id ??
                        null;


                    return (
                        normalizeTimetableId(
                            actualRoomTypeId
                        ) ===
                        normalizedRequestedRoomTypeId
                    );

                }


                // ------------------------------------------------
                // LEGACY TEXT FALLBACK
                // ------------------------------------------------

                const actualRoomType =
                    normalizeRoomType(
                        getTimetableRoomType(
                            room
                        )
                    );


                return (
                    actualRoomType ===
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
    // DIAGNOSTIC
    // ========================================================

    console.warn(
        "No compatible room matches requested room type.",
        {

            taskId:
                task.taskId,

            requirementId:
                task.requirementId,

            requestedRoomTypeId:
                normalizedRequestedRoomTypeId ||
                null,

            requestedType:
                requestedType ||
                null,

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
                            room.roomTypeId ??
                            room.room_type_id ??
                            room.typeId ??
                            room.type_id ??
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
// IMPORTANT:
//
// maxLessonsPerDay belongs to the REQUIREMENT.
//
// Therefore the counter must use:
//
//     requirementId + dayNumber
//
// NOT:
//
//     streamId + dayNumber
//
// This allows:
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
// to be tracked independently.
//
// ============================================================


// ============================================================
// CREATE REQUIREMENT/DAY KEY
// ============================================================

function getDailyRequirementKey(
    requirementId,
    dayNumber
) {

    const normalizedRequirementId =
        normalizeTimetableId(
            requirementId
        );


    const normalizedDayNumber =
        Number(
            dayNumber
        );


    return (
        `${normalizedRequirementId}__${normalizedDayNumber}`
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
        !(indexes.dailyRequirementLessons instanceof Map)
    ) {

        return 0;

    }


    const key =
        getDailyRequirementKey(
            requirementId,
            dayNumber
        );


    return (
        Number(
            indexes.dailyRequirementLessons.get(
                key
            )
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
        !(indexes.dailyRequirementLessons instanceof Map)
    ) {

        return;

    }


    const normalizedAmount =
        Number(
            amount
        );


    if (
        !Number.isFinite(
            normalizedAmount
        ) ||
        normalizedAmount <= 0
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
        currentCount +
        normalizedAmount
    );

}




   // ============================================================
// CREATE OCCUPANCY INDEXES
// ============================================================

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


            const periodId =
                normalizeKey(
                    period.id
                );


            if (
                !periodId
            ) {

                return;

            }


            periodLookup.set(
                periodId,
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

        periods,


        // ====================================================
        // TEACHER LIMITS
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
            !key &&
            key !== 0
        ) {

            return;

        }


        if (
            !map.has(
                key
            )
        ) {

            map.set(
                key,
                new Set()
            );

        }


        map.get(
            key
        ).add(
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
                            taskId ||
                            null,

                        lessonId:
                            lessonId ||
                            null,

                        subjectId:
                            subjectId ||
                            null,

                        streamId:
                            streamId ||
                            null,

                        parallelGroup:
                            normalizeKey(
                                entry.parallelGroup ??
                                entry.parallel_group
                            ) ||
                            null,

                        studentGroupIds:
                            studentGroups

                    });


                // ---------------------------------------------
                // TEACHER + SUBJECT + PERIOD
                // ---------------------------------------------
                //
                // This allows the conflict engine to recognize
                // the special valid case:
                //
                // same teacher
                // + same subject
                // + same period
                // + different streams
                //
                // = shared/concurrent teaching.
                //
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
            // STUDENT GROUP OCCUPANCY
            // =================================================

            studentGroups.forEach(
                studentGroupId => {

                    if (
                        !studentGroupId
                    ) {

                        return;

                    }


                    occupancy.studentGroupPeriod.add(
                        `${studentGroupId}__${periodId}`
                    );

                }
            );


            // =================================================
            // STUDENT GROUP / PERIOD LESSON DETAILS
            // =================================================

            studentGroups.forEach(
                studentGroupId => {

                    if (
                        !studentGroupId
                    ) {

                        return;

                    }


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

                            lessonId:
                                lessonId ||
                                null,

                            subjectId:
                                subjectId ||
                                null,

                            teacherId:
                                teacherId ||
                                null,

                            streamId:
                                streamId ||
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
                dayNumber !== undefined &&
                dayNumber !== ""
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
    // IMPORTANT:
    //
    // A double lesson occupies two periods but counts as ONE
    // lesson for maxLessonsPerDay.
    //
    // Therefore:
    //
    //     period 2 -> Chemistry
    //     period 3 -> Chemistry
    //
    // must produce:
    //
    //     Chemistry/day = 1
    //
    // NOT:
    //
    //     Chemistry/day = 2
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
                dayNumber === undefined ||
                dayNumber === ""
            ) {

                return;

            }


            // ------------------------------------------------
            // TASK / LESSON ID
            // ------------------------------------------------

            const taskId =
                normalizeKey(
                    entry.taskId ??
                    entry.task_id
                );


            const lessonId =
                normalizeKey(
                    entry.lessonId ??
                    entry.lesson_id
                );


            // ------------------------------------------------
            // PARALLEL OCCURRENCE
            // ------------------------------------------------
            //
            // This is an additional fallback for generated
            // entries where lessonId/taskId is not available.
            //
            // A double lesson should normally have the same
            // occurrence key in both periods.
            //
            // ------------------------------------------------

            const parallelOccurrenceKey =
                normalizeKey(
                    entry.parallelOccurrenceKey ??
                    entry.parallel_occurrence_key ??
                    entry.parallelOccurrence
                );


            // ------------------------------------------------
            // DETERMINE UNIQUE LESSON ID
            // ------------------------------------------------
            //
            // Priority:
            //
            // 1. lessonId
            // 2. taskId
            // 3. parallel occurrence key
            // 4. period fallback
            //
            // ------------------------------------------------

            const uniqueLessonId =
                lessonId ||
                taskId ||
                parallelOccurrenceKey ||
                `${requirementId}__${periodId}`;


            // ------------------------------------------------
            // DAILY REQUIREMENT KEY
            // ------------------------------------------------

            const dailyKey =
                getDailyRequirementKey(
                    requirementId,
                    dayNumber
                );


            // ------------------------------------------------
            // UNIQUE LESSON KEY
            // ------------------------------------------------

            const uniqueLessonKey =
                `${dailyKey}__${uniqueLessonId}`;


            // ------------------------------------------------
            // ALREADY COUNTED
            // ------------------------------------------------

            if (
                occupancy.dailyRequirementLessonKeys.has(
                    uniqueLessonKey
                )
            ) {

                return;

            }


            // ------------------------------------------------
            // REGISTER UNIQUE LESSON
            // ------------------------------------------------

            occupancy.dailyRequirementLessonKeys.add(
                uniqueLessonKey
            );


            // ------------------------------------------------
            // COUNT ONE LESSON
            // ------------------------------------------------

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


function getTaskParallelOccurrenceKey(
    task
) {

    if (
        !task
    ) {

        return "";

    }


    return normalizeTimetableId(
        task.parallelOccurrenceKey ??
        task.parallel_occurrence_key
    );

}


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


    // ========================================================
    // SUBJECT
    // ========================================================

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
        taskSubjectId !==
        existingSubjectId
    ) {

        return false;

    }


    // ========================================================
    // PARALLEL GROUP
    // ========================================================

    const taskParallelGroup =
        getTaskParallelGroup(
            task
        );


    const existingParallelGroup =
        getTaskParallelGroup(
            existingLesson
        );


    // ========================================================
    // PARALLEL OCCURRENCE
    // ========================================================

    const taskParallelOccurrenceKey =
        getTaskParallelOccurrenceKey(
            task
        );


    const existingParallelOccurrenceKey =
        getTaskParallelOccurrenceKey(
            existingLesson
        );


    // ========================================================
    // EXPLICIT PARALLEL TEACHING
    // ========================================================
    //
    // If either lesson belongs to an explicit parallel group,
    // BOTH must have:
    //
    //     same parallel group
    //     same parallel occurrence
    //
    // ========================================================

    if (
        taskParallelGroup ||
        existingParallelGroup
    ) {

        if (
            !taskParallelGroup ||
            !existingParallelGroup
        ) {

            return false;

        }


        if (
            taskParallelGroup !==
            existingParallelGroup
        ) {

            return false;

        }


        // ----------------------------------------------------
        // Explicit parallel groups must also have an
        // occurrence identity.
        // ----------------------------------------------------

        if (
            !taskParallelOccurrenceKey ||
            !existingParallelOccurrenceKey
        ) {

            return false;

        }


        return (
            taskParallelOccurrenceKey ===
            existingParallelOccurrenceKey
        );

    }


    // ========================================================
    // LEGACY SHARED TEACHING
    // ========================================================
    //
    // If neither lesson belongs to an explicit parallel group,
    // retain the existing shared-teaching compatibility:
    //
    // same subject + same teacher + same period
    //
    // may represent one shared teacher session.
    //
    // ========================================================

    return true;

}






function checkSingleSlotConflict(
    task,
    period,
    room,
    indexes
) {

    // ========================================================
    // BASIC VALIDATION
    // ========================================================

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
    // PERIOD ID
    // ========================================================

    const periodId =
        normalizeTimetableId(
            period.id
        );


    if (
        !periodId
    ) {

        return {
            valid: false,
            reason:
                "Period has no valid ID."
        };

    }


    // ========================================================
    // TASK IDS
    // ========================================================

    const studentGroups =
        getTaskStudentGroups(
            task
        );


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


    const taskParallelOccurrenceKey =
        getTaskParallelOccurrenceKey(
            task
        );


    const taskParallelIdentity =
        getTaskParallelIdentity(
            task
        );


    // ========================================================
    // STUDENT GROUP / STREAM CONFLICT
    // ========================================================

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


        const occupied =
            indexes.studentGroupPeriod instanceof Set &&
            indexes.studentGroupPeriod.has(
                studentGroupKey
            );


        if (
            !occupied
        ) {

            continue;

        }


        // ====================================================
        // GET EXISTING LESSONS
        // ====================================================

        const existingLessons =
            indexes.studentGroupPeriodLessons instanceof Map
                ? (
                    indexes.studentGroupPeriodLessons.get(
                        studentGroupKey
                    ) || []
                )
                : [];


        // ====================================================
        // UNKNOWN OCCUPANCY
        // ====================================================

        if (
            existingLessons.length === 0
        ) {

            return {
                valid: false,
                reason:
                    "Student group is already occupied in this period."
            };

        }


        // ====================================================
        // CHECK EVERY EXISTING LESSON
        // ====================================================
        //
        // ALL existing lessons must be legitimately parallel
        // with the new task.
        //
        // It is not enough for just one existing lesson to match.
        //
        // ====================================================

        const parallelTeachingAllowed =
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
                        getTaskParallelGroup(
                            existingLesson
                        );


                    const existingParallelOccurrenceKey =
                        getTaskParallelOccurrenceKey(
                            existingLesson
                        );


                    const existingParallelIdentity =
                        getTaskParallelIdentity(
                            existingLesson
                        );


                    // ========================================
                    // SUBJECT MUST BE DIFFERENT
                    // ========================================

                    if (
                        !taskSubjectId ||
                        !existingSubjectId ||
                        taskSubjectId ===
                        existingSubjectId
                    ) {

                        return false;

                    }


                    // ========================================
                    // TEACHER MUST BE DIFFERENT
                    // ========================================

                    if (
                        !taskTeacherId ||
                        !existingTeacherId ||
                        taskTeacherId ===
                        existingTeacherId
                    ) {

                        return false;

                    }


                    // ========================================
                    // EXPLICIT PARALLEL GROUP
                    // ========================================
                    //
                    // Both sides must have:
                    //
                    //     same group
                    //     same occurrence
                    //
                    // ========================================

                    if (
                        taskParallelGroup ||
                        existingParallelGroup
                    ) {

                        if (
                            !taskParallelGroup ||
                            !existingParallelGroup
                        ) {

                            return false;

                        }


                        if (
                            taskParallelGroup !==
                            existingParallelGroup
                        ) {

                            return false;

                        }


                        if (
                            !taskParallelOccurrenceKey ||
                            !existingParallelOccurrenceKey
                        ) {

                            return false;

                        }


                        if (
                            taskParallelOccurrenceKey !==
                            existingParallelOccurrenceKey
                        ) {

                            return false;

                        }


                        // ------------------------------------
                        // Full identity check
                        // ------------------------------------

                        if (
                            taskParallelIdentity &&
                            existingParallelIdentity &&
                            taskParallelIdentity !==
                            existingParallelIdentity
                        ) {

                            return false;

                        }


                        return true;

                    }


                    // ========================================
                    // NORMAL NON-GROUP PARALLEL TEACHING
                    // ========================================
                    //
                    // Retain compatibility with existing
                    // parallel teaching data that has no
                    // explicit parallel group.
                    //
                    // ========================================

                    return true;

                }
            );


        if (
            !parallelTeachingAllowed
        ) {

            return {
                valid: false,
                reason:
                    "Student group is already occupied by a conflicting lesson in this period."
            };

        }

    }


    // ========================================================
    // TEACHER CONFLICT
    // ========================================================

    if (
        taskTeacherId
    ) {

        const teacherKey =
            `${taskTeacherId}__${periodId}`;


        const teacherOccupied =
            indexes.teacherPeriod instanceof Set &&
            indexes.teacherPeriod.has(
                teacherKey
            );


        let existingTeacherLessons = [];


        if (
            teacherOccupied
        ) {

            existingTeacherLessons =
                getTeacherLessonsAtPeriod(
                    indexes,
                    taskTeacherId,
                    periodId
                );

        }


        // ====================================================
        // SHARED TEACHER SESSION
        // ====================================================
        //
        // A teacher can teach multiple streams simultaneously
        // when this is genuinely one shared/concurrent lesson.
        //
        // For explicit parallel groups:
        //
        //     same subject
        //     same parallel group
        //     same occurrence
        //
        // are required.
        //
        // ====================================================

        let teacherConcurrentSession =
            false;


        if (
            existingTeacherLessons.length > 0
        ) {

            teacherConcurrentSession =
                existingTeacherLessons.every(
                    existingLesson =>
                        areConcurrentTeacherLessonsAllowed(
                            task,
                            existingLesson
                        )
                );

        }


        // ====================================================
        // TEACHER PERIOD CONFLICT
        // ====================================================

        if (
            existingTeacherLessons.length > 0 &&
            !teacherConcurrentSession
        ) {

            return {
                valid: false,
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
                    taskTeacherId
                )
                : null;


        const projectedTeacherSessionIncrement =
            teacherConcurrentSession
                ? 0
                : 1;


        // ====================================================
        // DAILY TEACHER LIMIT
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
                        taskTeacherId,
                        dayNumber,
                        Array.isArray(indexes.periods)
                            ? indexes.periods
                            : []
                    );


                if (
                    currentDailyLessons +
                    projectedTeacherSessionIncrement >
                    maximumDailyLessons
                ) {

                    return {
                        valid: false,
                        reason:
                            `Teacher would exceed the maximum of ${maximumDailyLessons} lessons per day.`
                    };

                }

            }

        }


        // ====================================================
        // WEEKLY TEACHER LIMIT
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
                    taskTeacherId
                );


            if (
                currentWeeklyLessons +
                projectedTeacherSessionIncrement >
                maximumWeeklyLessons
            ) {

                return {
                    valid: false,
                    reason:
                        `Teacher would exceed the maximum of ${maximumWeeklyLessons} lessons per week.`
                };

            }

        }


        // ====================================================
        // TEACHER CONSECUTIVE LIMIT
        // ====================================================

        if (
            !teacherConcurrentSession &&
            wouldExceedTeacherConsecutiveLimit(
                task,
                [period],
                indexes
            )
        ) {

            return {
                valid: false,
                reason:
                    getTeacherConsecutiveConflictReason(
                        task,
                        indexes
                    )
            };

        }

    }


    // ========================================================
    // ROOM CONFLICT
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
            indexes.roomPeriod instanceof Set &&
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
        Number.isFinite(dayNumber)
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
                valid: false,
                reason:
                    `Maximum daily lessons reached for requirement ${requirementId}.`
            };

        }

    }


    // ========================================================
    // VALID
    // ========================================================

    return {
        valid: true,
        reason: ""
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
// PARALLEL LESSON RULE:
//
// Multiple lessons may occupy the same stream/student-group and
// period ONLY when they belong to the same explicit:
//
//     parallelGroup
//     +
//     parallelOccurrenceKey
//
// The detailed occupancy indexes therefore retain the complete
// parallel identity.
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


    // ========================================================
    // NORMALIZED IDENTIFIERS
    // ========================================================

    const periodId =
        normalizeTimetableId(
            period.id
        );


    if (
        !periodId
    ) {

        console.warn(
            "reserveSlot: Period has no valid ID."
        );

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
            task.lesson_id ??
            taskId
        );


    const requirementId =
        normalizeTimetableId(
            task.requirementId ??
            task.requirement_id
        );


    const streamId =
        normalizeTimetableId(
            task.streamId ??
            task.stream_id
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


    // ========================================================
    // PARALLEL IDENTITY
    // ========================================================

    const parallelGroup =
        getTaskParallelGroup(
            task
        );


    const parallelOccurrenceKey =
        getTaskParallelOccurrenceKey(
            task
        );


    const parallelOccurrence =
        Number(
            task.parallelOccurrence ??
            task.parallel_occurrence
        );


    const hasValidParallelOccurrence =
        Number.isFinite(
            parallelOccurrence
        );


    const parallelOccurrenceIndexes =
        Array.isArray(
            task.parallelOccurrenceIndexes
        )
            ? [
                ...task.parallelOccurrenceIndexes
            ]
            : (
                Array.isArray(
                    task.parallel_occurrence_indexes
                )
                    ? [
                        ...task.parallel_occurrence_indexes
                    ]
                    : []
            );


    const parallelIdentity =
        (
            parallelGroup &&
            parallelOccurrenceKey
        )
            ? `${parallelGroup}__${parallelOccurrenceKey}`
            : "";


    // ========================================================
    // DAY
    // ========================================================

    const dayNumber =
        Number(
            period.dayNumber ??
            period.day_number
        );


    const hasValidDay =
        Number.isFinite(
            dayNumber
        );


    // ========================================================
    // STUDENT GROUPS
    // ========================================================

    const studentGroups =
        getTaskStudentGroups(
            task
        );


    // ========================================================
    // ENSURE REQUIRED INDEXES EXIST
    // ========================================================

    if (
        !(indexes.taskPeriod instanceof Set)
    ) {

        indexes.taskPeriod =
            new Set();

    }


    if (
        !(indexes.streamPeriod instanceof Set)
    ) {

        indexes.streamPeriod =
            new Set();

    }


    // --------------------------------------------------------
    // DETAILED STREAM/PERIOD INDEX
    // --------------------------------------------------------

    if (
        !(indexes.streamPeriodLessons instanceof Map)
    ) {

        indexes.streamPeriodLessons =
            new Map();

    }


    if (
        !(indexes.teacherPeriod instanceof Set)
    ) {

        indexes.teacherPeriod =
            new Set();

    }


    if (
        !(indexes.teacherSubjectPeriod instanceof Set)
    ) {

        indexes.teacherSubjectPeriod =
            new Set();

    }


    if (
        !(indexes.roomPeriod instanceof Set)
    ) {

        indexes.roomPeriod =
            new Set();

    }


    if (
        !(indexes.studentGroupPeriod instanceof Set)
    ) {

        indexes.studentGroupPeriod =
            new Set();

    }


    if (
        !(indexes.studentGroupPeriodLessons instanceof Map)
    ) {

        indexes.studentGroupPeriodLessons =
            new Map();

    }


    if (
        !(indexes.teacherPeriodLessons instanceof Map)
    ) {

        indexes.teacherPeriodLessons =
            new Map();

    }


    if (
        !(indexes.teacherDay instanceof Map)
    ) {

        indexes.teacherDay =
            new Map();

    }


    if (
        !(indexes.streamDay instanceof Map)
    ) {

        indexes.streamDay =
            new Map();

    }


    if (
        !(indexes.studentGroupDay instanceof Map)
    ) {

        indexes.studentGroupDay =
            new Map();

    }


    if (
        !(indexes.roomDay instanceof Map)
    ) {

        indexes.roomDay =
            new Map();

    }


    if (
        !(indexes.requirementDay instanceof Map)
    ) {

        indexes.requirementDay =
            new Map();

    }


    if (
        !(indexes.lessonDay instanceof Map)
    ) {

        indexes.lessonDay =
            new Map();

    }


    if (
        !(indexes.dailyRequirementLessonKeys instanceof Set)
    ) {

        indexes.dailyRequirementLessonKeys =
            new Set();

    }


    if (
        !indexes.dailyRequirementLessons ||
        !(indexes.dailyRequirementLessons instanceof Map)
    ) {

        indexes.dailyRequirementLessons =
            new Map();

    }


    // ========================================================
    // TASK / PERIOD
    // ========================================================
    //
    // A task occupies this exact period.
    //
    // This is also used by releaseReservedSlot().
    //
    // Do not duplicate the same task-period key.
    //
    // ========================================================

    if (
        taskId
    ) {

        const taskPeriodKey =
            `${taskId}__${periodId}`;


        indexes.taskPeriod.add(
            taskPeriodKey
        );

    }


    // ========================================================
    // STREAM / PERIOD
    // ========================================================

    if (
        streamId
    ) {

        const streamPeriodKey =
            `${streamId}__${periodId}`;


        indexes.streamPeriod.add(
            streamPeriodKey
        );


        // ----------------------------------------------------
        // DETAILED STREAM/PERIOD LESSON INDEX
        // ----------------------------------------------------
        //
        // This preserves the identity of every lesson sharing
        // the same stream and period.
        //
        // Important for explicit parallel teaching.
        //
        // ----------------------------------------------------

        let streamLessons =
            indexes.streamPeriodLessons.get(
                streamPeriodKey
            );


        if (
            !Array.isArray(
                streamLessons
            )
        ) {

            streamLessons = [];

            indexes.streamPeriodLessons.set(
                streamPeriodKey,
                streamLessons
            );

        }


        const streamLessonAlreadyExists =
            streamLessons.some(
                existingLesson => {

                    const existingTaskId =
                        normalizeTimetableId(
                            existingLesson?.taskId
                        );


                    return (
                        taskId &&
                        existingTaskId ===
                        taskId
                    );

                }
            );


        if (
            !streamLessonAlreadyExists
        ) {

            streamLessons.push({

                taskId:
                    taskId ||
                    null,

                lessonId:
                    lessonId ||
                    null,

                streamId:
                    streamId ||
                    null,

                subjectId:
                    subjectId ||
                    null,

                teacherId:
                    teacherId ||
                    null,

                requirementId:
                    requirementId ||
                    null,

                parallelGroup:
                    parallelGroup ||
                    null,

                parallelOccurrenceKey:
                    parallelOccurrenceKey ||
                    null,

                parallelOccurrence:
                    hasValidParallelOccurrence
                        ? parallelOccurrence
                        : null,

                parallelOccurrenceIndexes:
                    [
                        ...parallelOccurrenceIndexes
                    ],

                parallelIdentity:
                    parallelIdentity ||
                    null

            });

        }

    }


    // ========================================================
    // STUDENT GROUP / PERIOD
    // ========================================================

    studentGroups.forEach(
        studentGroupId => {

            if (
                !studentGroupId
            ) {

                return;

            }


            const studentGroupKey =
                `${studentGroupId}__${periodId}`;


            indexes.studentGroupPeriod.add(
                studentGroupKey
            );


            // ------------------------------------------------
            // DETAILED STUDENT GROUP LESSON INDEX
            // ------------------------------------------------

            let lessonList =
                indexes.studentGroupPeriodLessons.get(
                    studentGroupKey
                );


            if (
                !Array.isArray(
                    lessonList
                )
            ) {

                lessonList = [];

                indexes.studentGroupPeriodLessons.set(
                    studentGroupKey,
                    lessonList
                );

            }


            // ------------------------------------------------
            // PREVENT DUPLICATE DETAIL ENTRY
            // ------------------------------------------------

            const alreadyExists =
                lessonList.some(
                    existingLesson => {

                        const existingTaskId =
                            normalizeTimetableId(
                                existingLesson?.taskId
                            );


                        return (
                            taskId &&
                            existingTaskId ===
                            taskId
                        );

                    }
                );


            if (
                !alreadyExists
            ) {

                lessonList.push({

                    taskId:
                        taskId ||
                        null,

                    lessonId:
                        lessonId ||
                        null,

                    subjectId:
                        subjectId ||
                        null,

                    teacherId:
                        teacherId ||
                        null,

                    streamId:
                        streamId ||
                        null,

                    requirementId:
                        requirementId ||
                        null,

                    parallelGroup:
                        parallelGroup ||
                        null,

                    parallelOccurrenceKey:
                        parallelOccurrenceKey ||
                        null,

                    parallelOccurrence:
                        hasValidParallelOccurrence
                            ? parallelOccurrence
                            : null,

                    parallelOccurrenceIndexes:
                        [
                            ...parallelOccurrenceIndexes
                        ],

                    parallelIdentity:
                        parallelIdentity ||
                        null

                });

            }

        }
    );


    // ========================================================
    // TEACHER / PERIOD
    // ========================================================

    if (
        teacherId
    ) {

        const teacherPeriodKey =
            `${teacherId}__${periodId}`;


        indexes.teacherPeriod.add(
            teacherPeriodKey
        );


        // ----------------------------------------------------
        // TEACHER + SUBJECT + PERIOD
        // ----------------------------------------------------

        if (
            subjectId
        ) {

            indexes.teacherSubjectPeriod.add(
                `${teacherId}__${subjectId}__${periodId}`
            );

        }


        // ----------------------------------------------------
        // DETAILED TEACHER LESSON INDEX
        // ----------------------------------------------------

        let teacherLessons =
            indexes.teacherPeriodLessons.get(
                teacherPeriodKey
            );


        if (
            !Array.isArray(
                teacherLessons
            )
        ) {

            teacherLessons = [];

            indexes.teacherPeriodLessons.set(
                teacherPeriodKey,
                teacherLessons
            );

        }


        const alreadyExists =
            teacherLessons.some(
                existingLesson => {

                    const existingTaskId =
                        normalizeTimetableId(
                            existingLesson?.taskId
                        );


                    return (
                        taskId &&
                        existingTaskId ===
                        taskId
                    );

                }
            );


        if (
            !alreadyExists
        ) {

            teacherLessons.push({

                taskId:
                    taskId ||
                    null,

                lessonId:
                    lessonId ||
                    null,

                subjectId:
                    subjectId ||
                    null,

                streamId:
                    streamId ||
                    null,

                requirementId:
                    requirementId ||
                    null,

                parallelGroup:
                    parallelGroup ||
                    null,

                parallelOccurrenceKey:
                    parallelOccurrenceKey ||
                    null,

                parallelOccurrence:
                    hasValidParallelOccurrence
                        ? parallelOccurrence
                        : null,

                parallelOccurrenceIndexes:
                    [
                        ...parallelOccurrenceIndexes
                    ],

                parallelIdentity:
                    parallelIdentity ||
                    null,

                studentGroupIds:
                    [
                        ...studentGroups
                    ]

            });

        }

    }


    // ========================================================
    // ROOM / PERIOD
    // ========================================================

    if (
        room &&
        room.id !== null &&
        room.id !== undefined
    ) {

        const roomId =
            normalizeTimetableId(
                room.id
            );


        if (
            roomId &&
            roomId.toLowerCase() !== "none"
        ) {

            indexes.roomPeriod.add(
                `${roomId}__${periodId}`
            );

        }

    }


    // ========================================================
    // DAY INDEXES
    // ========================================================

    if (
        hasValidDay
    ) {

        // ----------------------------------------------------
        // TEACHER DAY
        // ----------------------------------------------------

        if (
            teacherId
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
            streamId
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

        studentGroups.forEach(
            studentGroupId => {

                if (
                    !studentGroupId
                ) {

                    return;

                }


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


        // ----------------------------------------------------
        // ROOM DAY
        // ----------------------------------------------------

        if (
            room &&
            room.id !== null &&
            room.id !== undefined
        ) {

            const roomId =
                normalizeTimetableId(
                    room.id
                );


            if (
                roomId &&
                roomId.toLowerCase() !== "none"
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
            requirementId
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


        // ----------------------------------------------------
        // LESSON DAY
        // ----------------------------------------------------

        if (
            lessonId
        ) {

            if (
                !indexes.lessonDay.has(
                    lessonId
                )
            ) {

                indexes.lessonDay.set(
                    lessonId,
                    new Set()
                );

            }


            indexes.lessonDay
                .get(
                    lessonId
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
    // IMPORTANT:
    //
    // A single lesson may occupy:
    //
    //     Period 2
    //     Period 3
    //
    // when it is a double lesson.
    //
    // It must therefore count as:
    //
    //     1 lesson
    //
    // rather than:
    //
    //     2 lessons
    //
    // Use lessonId first, then taskId as the stable lesson
    // identity.
    //
    // NEVER use periodId as the fallback identity because
    // each period of a double lesson would then look like a
    // different lesson.
    //
    // ========================================================

    if (
        requirementId &&
        hasValidDay
    ) {

        const dailyLessonIdentity =
            lessonId ||
            taskId;


        if (
            dailyLessonIdentity
        ) {

            const uniqueDailyLessonKey =
                `${requirementId}__${dayNumber}__${dailyLessonIdentity}`;


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

    }


    // ========================================================
    // COMPLETE
    // ========================================================

    return true;

}
// ============================================================
// CREATE GENERATED ENTRY
// ============================================================
//
// Creates the final timetable entry for one occupied period.
//
// IMPORTANT:
//
// Parallel lessons must retain their COMPLETE identity:
//
//     parallel_group
//     parallel_occurrence_key
//     parallel_occurrence
//     parallel_occurrence_indexes
//     parallel_identity
//
// The audit stage uses these fields to distinguish:
//
//     same parallel occurrence
//
// from:
//
//     different occurrences in the same parallel group.
//
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


    // ========================================================
    // STUDENT GROUPS
    // ========================================================

    const studentGroups =
        getTaskStudentGroups(
            task
        );


    // ========================================================
    // PARALLEL IDENTITY
    // ========================================================

    const parallelGroup =
        getTaskParallelGroup(
            task
        );


    const parallelOccurrenceKey =
        getTaskParallelOccurrenceKey(
            task
        );


    const parallelOccurrence =
        Number(
            task.parallelOccurrence ??
            task.parallel_occurrence
        );


    const hasValidParallelOccurrence =
        Number.isFinite(
            parallelOccurrence
        );


    const parallelOccurrenceIndexes =
        Array.isArray(
            task.parallelOccurrenceIndexes
        )
            ? [
                ...task.parallelOccurrenceIndexes
            ]
            : (
                Array.isArray(
                    task.parallel_occurrence_indexes
                )
                    ? [
                        ...task.parallel_occurrence_indexes
                    ]
                    : []
            );


    const parallelIdentity =
        (
            parallelGroup &&
            parallelOccurrenceKey
        )
            ? `${parallelGroup}__${parallelOccurrenceKey}`
            : "";


    // ========================================================
    // CREATE ENTRY
    // ========================================================

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

        parallel_group:
            parallelGroup ||
            null,

        // ====================================================
        // PARALLEL OCCURRENCE KEY
        // ====================================================
        //
        // Example:
        //
        //     BIO/PHY-O1
        //     BIO/PHY-O3
        //
        // This is required to distinguish separate
        // occurrences inside the same parallel group.
        //
        // ====================================================

        parallel_occurrence_key:
            parallelOccurrenceKey ||
            null,

        // ====================================================
        // NUMERIC PARALLEL OCCURRENCE
        // ====================================================

        parallel_occurrence:
            hasValidParallelOccurrence
                ? parallelOccurrence
                : null,

        // ====================================================
        // OCCURRENCE INDEXES
        // ====================================================
        //
        // A double lesson may contain:
        //
        //     [1, 2]
        //
        // while a single lesson may contain:
        //
        //     [3]
        //
        // ====================================================

        parallel_occurrence_indexes:
            [
                ...parallelOccurrenceIndexes
            ],

        // ====================================================
        // COMPLETE PARALLEL IDENTITY
        // ====================================================

        parallel_identity:
            parallelIdentity ||
            null,

        // ====================================================
        // STUDENT GROUPS
        // ====================================================

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
//
// Validates BOTH periods of a double lesson before reservation.
//
// IMPORTANT:
//
// Explicit parallel teaching is allowed only when lessons have:
//
//     same parallel group
//     +
//     same parallel occurrence key
//
// Therefore:
//
//     BIO/PHY + O1
//
// may run concurrently with:
//
//     BIO/PHY + O1
//
// but NOT:
//
//     BIO/PHY + O3
//
// ============================================================

function checkDoubleLessonConflict(
    task,
    firstPeriod,
    secondPeriod,
    room,
    indexes
) {

    // ========================================================
    // VALIDATE INPUT
    // ========================================================

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
    // PERIOD IDS
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

            valid:
                false,

            reason:
                "Double lesson periods must have valid IDs."

        };

    }


    // ========================================================
    // SAME PERIOD PROTECTION
    // ========================================================

    if (
        firstPeriodId ===
        secondPeriodId
    ) {

        return {

            valid:
                false,

            reason:
                "A double lesson cannot use the same period twice."

        };

    }


    // ========================================================
    // CONSECUTIVE PERIOD VALIDATION
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
    // DAY VALIDATION
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
        !Number.isFinite(
            firstDay
        ) ||
        !Number.isFinite(
            secondDay
        )
    ) {

        return {

            valid:
                false,

            reason:
                "Double lesson periods must have valid day numbers."

        };

    }


    if (
        firstDay !==
        secondDay
    ) {

        return {

            valid:
                false,

            reason:
                "Double lesson periods must be on the same day."

        };

    }


    // ========================================================
    // IDENTIFIERS
    // ========================================================

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
    // PARALLEL IDENTITY
    // ========================================================

    const taskParallelGroup =
        getTaskParallelGroup(
            task
        );


    const taskParallelOccurrenceKey =
        getTaskParallelOccurrenceKey(
            task
        );


    const taskParallelIdentity =
        getTaskParallelIdentity(
            task
        );


    // ========================================================
    // STUDENT GROUPS
    // ========================================================

    const studentGroups =
        getTaskStudentGroups(
            task
        );


    // ========================================================
    // HELPER:
    // CHECK STUDENT-GROUP PARALLEL COMPATIBILITY
    // ========================================================

    function isStudentGroupParallelAllowed(
        existingLessons
    ) {

        if (
            !Array.isArray(
                existingLessons
            ) ||
            existingLessons.length === 0
        ) {

            return false;

        }


        return existingLessons.every(
            existingLesson => {

                if (
                    !existingLesson
                ) {

                    return false;

                }


                // ==============================================
                // SUBJECT
                // ==============================================

                const existingSubjectId =
                    normalizeTimetableId(
                        existingLesson.subjectId ??
                        existingLesson.subject_id
                    );


                // ==============================================
                // TEACHER
                // ==============================================

                const existingTeacherId =
                    normalizeTimetableId(
                        existingLesson.teacherId ??
                        existingLesson.teacher_id
                    );


                // ==============================================
                // PARALLEL GROUP
                // ==============================================

                const existingParallelGroup =
                    getTaskParallelGroup(
                        existingLesson
                    );


                // ==============================================
                // PARALLEL OCCURRENCE
                // ==============================================

                const existingParallelOccurrenceKey =
                    getTaskParallelOccurrenceKey(
                        existingLesson
                    );


                const existingParallelIdentity =
                    getTaskParallelIdentity(
                        existingLesson
                    );


                // ==============================================
                // SUBJECTS MUST BE DIFFERENT
                // ==============================================

                if (
                    !subjectId ||
                    !existingSubjectId ||
                    subjectId ===
                    existingSubjectId
                ) {

                    return false;

                }


                // ==============================================
                // TEACHERS MUST BE DIFFERENT
                // ==============================================

                if (
                    !teacherId ||
                    !existingTeacherId ||
                    teacherId ===
                    existingTeacherId
                ) {

                    return false;

                }


                // ==============================================
                // EXPLICIT PARALLEL GROUP REQUIRED
                // ==============================================

                if (
                    !taskParallelGroup ||
                    !existingParallelGroup
                ) {

                    return false;

                }


                // ==============================================
                // SAME PARALLEL GROUP
                // ==============================================

                if (
                    taskParallelGroup !==
                    existingParallelGroup
                ) {

                    return false;

                }


                // ==============================================
                // SAME OCCURRENCE REQUIRED
                // ==============================================

                if (
                    !taskParallelOccurrenceKey ||
                    !existingParallelOccurrenceKey
                ) {

                    return false;

                }


                if (
                    taskParallelOccurrenceKey !==
                    existingParallelOccurrenceKey
                ) {

                    return false;

                }


                // ==============================================
                // COMPLETE IDENTITY
                // ==============================================

                if (
                    taskParallelIdentity &&
                    existingParallelIdentity &&
                    taskParallelIdentity !==
                    existingParallelIdentity
                ) {

                    return false;

                }


                return true;

            }
        );

    }


    // ========================================================
    // HELPER:
    // GET TEACHER LESSONS AT PERIOD
    // ========================================================

    function getExistingTeacherLessons(
        periodId
    ) {

        if (
            !teacherId
        ) {

            return [];

        }


        return getTeacherLessonsAtPeriod(
            indexes,
            teacherId,
            periodId
        );

    }


    // ========================================================
    // EXISTING TEACHER LESSONS
    // ========================================================

    const existingFirstTeacherLessons =
        getExistingTeacherLessons(
            firstPeriodId
        );


    const existingSecondTeacherLessons =
        getExistingTeacherLessons(
            secondPeriodId
        );


    // ========================================================
    // TEACHER CONFLICT — FIRST PERIOD
    // ========================================================

    if (
        existingFirstTeacherLessons.length > 0
    ) {

        const firstTeacherConcurrent =
            existingFirstTeacherLessons.every(
                existingLesson =>
                    areConcurrentTeacherLessonsAllowed(
                        task,
                        existingLesson
                    )
            );


        if (
            !firstTeacherConcurrent
        ) {

            return {

                valid:
                    false,

                reason:
                    "Teacher is already teaching a conflicting lesson in the first period."

            };

        }

    }


    // ========================================================
    // TEACHER CONFLICT — SECOND PERIOD
    // ========================================================

    if (
        existingSecondTeacherLessons.length > 0
    ) {

        const secondTeacherConcurrent =
            existingSecondTeacherLessons.every(
                existingLesson =>
                    areConcurrentTeacherLessonsAllowed(
                        task,
                        existingLesson
                    )
            );


        if (
            !secondTeacherConcurrent
        ) {

            return {

                valid:
                    false,

                reason:
                    "Teacher is already teaching a conflicting lesson in the second period."

            };

        }

    }


    // ========================================================
    // STUDENT GROUP CONFLICT — FIRST PERIOD
    // ========================================================

    for (
        const studentGroupId of studentGroups
    ) {

        if (
            !studentGroupId
        ) {

            continue;

        }


        const key =
            `${studentGroupId}__${firstPeriodId}`;


        if (
            !indexes.studentGroupPeriod ||
            !indexes.studentGroupPeriod.has(
                key
            )
        ) {

            continue;

        }


        const existingLessons =
            indexes.studentGroupPeriodLessons
                instanceof Map
                ? (
                    indexes.studentGroupPeriodLessons.get(
                        key
                    ) || []
                )
                : [];


        if (
            !isStudentGroupParallelAllowed(
                existingLessons
            )
        ) {

            return {

                valid:
                    false,

                reason:
                    "Student group is already occupied by a conflicting lesson in the first period."

            };

        }

    }


    // ========================================================
    // STUDENT GROUP CONFLICT — SECOND PERIOD
    // ========================================================

    for (
        const studentGroupId of studentGroups
    ) {

        if (
            !studentGroupId
        ) {

            continue;

        }


        const key =
            `${studentGroupId}__${secondPeriodId}`;


        if (
            !indexes.studentGroupPeriod ||
            !indexes.studentGroupPeriod.has(
                key
            )
        ) {

            continue;

        }


        const existingLessons =
            indexes.studentGroupPeriodLessons
                instanceof Map
                ? (
                    indexes.studentGroupPeriodLessons.get(
                        key
                    ) || []
                )
                : [];


        if (
            !isStudentGroupParallelAllowed(
                existingLessons
            )
        ) {

            return {

                valid:
                    false,

                reason:
                    "Student group is already occupied by a conflicting lesson in the second period."

            };

        }

    }


    // ========================================================
    // ROOM CONFLICT — FIRST PERIOD
    // ========================================================

    const roomId =
        room &&
        room.id
            ? normalizeTimetableId(
                room.id
            )
            : "";


    if (
        roomId &&
        indexes.roomPeriod
    ) {

        const firstRoomKey =
            `${roomId}__${firstPeriodId}`;


        if (
            indexes.roomPeriod.has(
                firstRoomKey
            )
        ) {

            return {

                valid:
                    false,

                reason:
                    "Room is already occupied in the first period."

            };

        }

    }


    // ========================================================
    // ROOM CONFLICT — SECOND PERIOD
    // ========================================================

    if (
        roomId &&
        indexes.roomPeriod
    ) {

        const secondRoomKey =
            `${roomId}__${secondPeriodId}`;


        if (
            indexes.roomPeriod.has(
                secondRoomKey
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
    // TEACHER DAILY / WEEKLY LIMITS
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


        const firstIsConcurrent =
            existingFirstTeacherLessons.length > 0 &&
            existingFirstTeacherLessons.every(
                existingLesson =>
                    areConcurrentTeacherLessonsAllowed(
                        task,
                        existingLesson
                    )
            );


        const secondIsConcurrent =
            existingSecondTeacherLessons.length > 0 &&
            existingSecondTeacherLessons.every(
                existingLesson =>
                    areConcurrentTeacherLessonsAllowed(
                        task,
                        existingLesson
                    )
            );


        const firstSessionIncrement =
            firstIsConcurrent
                ? 0
                : 1;


        const secondSessionIncrement =
            secondIsConcurrent
                ? 0
                : 1;


        const teacherSessionIncrement =
            firstSessionIncrement +
            secondSessionIncrement;


        // ----------------------------------------------------
        // DAILY LIMIT
        // ----------------------------------------------------

        const maximumDailyLessons =
            Number(
                teacherLimits?.maxLessonsPerDay
            ) || 0;


        if (
            maximumDailyLessons > 0
        ) {

            const currentDailyLessons =
                getTeacherDailyLessonCountFromPeriods(
                    indexes,
                    teacherId,
                    firstDay,
                    indexes.periods
                );


            const projectedDailyLessons =
                currentDailyLessons +
                teacherSessionIncrement;


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


        // ----------------------------------------------------
        // WEEKLY LIMIT
        // ----------------------------------------------------

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
                currentWeeklyLessons +
                teacherSessionIncrement;


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
    // TEACHER CONSECUTIVE LIMIT
    // ========================================================

    if (
        teacherId
    ) {

        const exceedsConsecutiveLimit =
            wouldExceedTeacherConsecutiveLimit(
                task,
                [
                    firstPeriod,
                    secondPeriod
                ],
                indexes
            );


        if (
            exceedsConsecutiveLimit
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
    // REQUIREMENT DAILY LIMIT
    // ========================================================

    const maxPerDay =
        Number(
            task.maxLessonsPerDay ??
            task.max_lessons_per_day
        ) || 0;


    if (
        requirementId &&
        maxPerDay > 0
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

            
function placeDoubleLesson(
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
        task.taskType !== "double" ||
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
                "Invalid double lesson placement data."

        };

    }


    // ========================================================
    // GET CONSECUTIVE TEACHING PERIOD PAIRS
    // ========================================================

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


    // ========================================================
    // REQUIRED ROOM BUT NONE AVAILABLE
    // ========================================================

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


    // ========================================================
    // CANDIDATE ROOMS
    // ========================================================

    const candidateRooms =
        requiresRoom
            ? compatibleRooms
            : [null];


    // ========================================================
    // SHUFFLE PERIOD PAIRS
    // ========================================================

    const candidatePairs =
        shuffleArray(
            pairs
        );


    // ========================================================
    // TRACK WHETHER ANY PAIR WAS TESTED
    // ========================================================

    let conflictCount = 0;


    // ========================================================
    // TRY EACH PERIOD PAIR
    // ========================================================

    for (
        const pair of candidatePairs
    ) {

        if (
            !pair ||
            !pair.first ||
            !pair.second
        ) {

            continue;

        }


        // ====================================================
        // TRY EACH COMPATIBLE ROOM
        // ====================================================

        const shuffledRooms =
            shuffleArray(
                candidateRooms
            );


        for (
            const room of shuffledRooms
        ) {

            // ==================================================
            // CHECK BOTH PERIODS
            // ==================================================

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

                conflictCount++;

                continue;

            }


            // ==================================================
            // RESERVE FIRST PERIOD
            // ==================================================

            const firstReserved =
                reserveSlot(
                    task,
                    pair.first,
                    room,
                    indexes
                );


            if (
                !firstReserved
            ) {

                console.warn(
                    "DOUBLE LESSON FIRST PERIOD RESERVATION FAILED:",
                    {
                        taskId:
                            task.taskId,

                        periodId:
                            pair.first.id
                    }
                );

                continue;

            }


            // ==================================================
            // RESERVE SECOND PERIOD
            // ==================================================

            const secondReserved =
                reserveSlot(
                    task,
                    pair.second,
                    room,
                    indexes
                );


            // ==================================================
            // ROLLBACK FIRST PERIOD IF SECOND FAILS
            // ==================================================

            if (
                !secondReserved
            ) {

                console.warn(
                    "DOUBLE LESSON SECOND PERIOD RESERVATION FAILED:",
                    {
                        taskId:
                            task.taskId,

                        periodId:
                            pair.second.id
                    }
                );


                // ------------------------------------------------
                // The conflict check already passed, so this
                // should be extremely rare.
                //
                // Release the first reservation so the generator
                // does not leave a half-placed double lesson.
                // ------------------------------------------------

                if (
                    typeof releaseReservedSlot ===
                    "function"
                ) {

                    releaseReservedSlot(
                        task,
                        pair.first,
                        room,
                        indexes
                    );

                }


                continue;

            }


            // ==================================================
            // CREATE BOTH GENERATED ENTRIES
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
            // DEBUG
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

                    teacherId:
                        task.teacherId,

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


            // ==================================================
            // SUCCESS
            // ==================================================

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
                null,

            candidatePairs:
                candidatePairs.length,

            conflictCount:
                conflictCount

        }
    );


    return {

        placed:
            false,

        entries:
            [],

        reason:
            "No valid consecutive period pair and room combination was found."

    };

}




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
    // ROOM REQUIREMENT
    // ========================================================

    const requiresRoom =
        Boolean(
            task.requiresRoom
        );


    // ========================================================
    // GET COMPATIBLE ROOMS
    // ========================================================

    const compatibleRooms =
        getCompatibleRooms(
            task,
            rooms
        );


    // ========================================================
    // REQUIRED ROOM BUT NONE AVAILABLE
    // ========================================================

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
    // SHUFFLE PERIODS
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

        if (
            !period ||
            !period.id
        ) {

            continue;

        }


        // ====================================================
        // GET ROOM OPTIONS
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


            if (
                !conflict ||
                !conflict.valid
            ) {

                continue;

            }


            // ==================================================
            // RESERVE SLOT
            // ==================================================

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

                console.warn(
                    "SINGLE LESSON RESERVATION FAILED:",
                    {

                        taskId:
                            task.taskId,

                        periodId:
                            period.id,

                        roomId:
                            room?.id ||
                            null

                    }
                );

                continue;

            }


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

                    requirementId:
                        task.requirementId,

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
                        null,

                    parallelGroup:
                        task.parallelGroup ||
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
            "No valid period and room combination was found."

    };

}

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
// GET TASK PARALLEL IDENTITY
// ============================================================
//
// A parallel identity uniquely identifies:
//
//     parallel group + parallel occurrence
//
// Example:
//
//     BIO/PHY__O1
//
// This prevents lessons from the same parallel group but
// DIFFERENT occurrences from being treated as concurrent.
//
// ============================================================

function getTaskParallelIdentity(task) {

    if (!task) {
        return "";
    }

    const parallelGroup =
        getTaskParallelGroup(task);

    const parallelOccurrenceKey =
        getTaskParallelOccurrenceKey(task);

    if (
        !parallelGroup ||
        !parallelOccurrenceKey
    ) {
        return "";
    }

    return (
        `${parallelGroup}__${parallelOccurrenceKey}`
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
    // Double lessons require two consecutive teaching periods.
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
    // Do NOT treat ordinary "classroom" as specialized.
    //
    // ========================================================

    const normalizedRoomType =
        normalizeRoomType(
            task.roomType
        );


    const isSpecializedRoom =
        Boolean(
            task.roomTypeId
        ) ||
        (
            normalizedRoomType &&
            normalizedRoomType !== "classroom" &&
            normalizedRoomType !== "none"
        );


    if (
        isSpecializedRoom
    ) {

        score += 300;

    }


    // ========================================================
    // 4. NUMBER OF COMPATIBLE ROOMS
    // ========================================================
    //
    // Fewer compatible rooms means greater scheduling
    // restriction.
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
    // 6. GET REQUIREMENT
    // ========================================================

    const requirement =
        getTaskRequirement(
            task,
            lookup
        );


    // ========================================================
    // 7. WEEKLY FREQUENCY
    // ========================================================

    const lessonsPerWeek =
        Number(
            requirement?.lessonsPerWeek
        ) || 0;


    score += Math.min(
        lessonsPerWeek * 20,
        200
    );


    // ========================================================
    // 8. DOUBLE LESSON FREQUENCY
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


            // ==================================================
            // 1. PRIORITY SCORE
            // ==================================================

            if (
                scoreA !==
                scoreB
            ) {

                return (
                    scoreB -
                    scoreA
                );

            }


            // ==================================================
            // 2. DOUBLE LESSON FIRST
            // ==================================================

            const aIsDouble =
                a?.taskType === "double";


            const bIsDouble =
                b?.taskType === "double";


            if (
                aIsDouble !==
                bIsDouble
            ) {

                return aIsDouble
                    ? -1
                    : 1;

            }


            // ==================================================
            // 3. LONGER DURATION FIRST
            // ==================================================

            const durationA =
                Number(
                    a?.duration
                ) || 0;


            const durationB =
                Number(
                    b?.duration
                ) || 0;


            if (
                durationA !==
                durationB
            ) {

                return (
                    durationB -
                    durationA
                );

            }


            // ==================================================
            // 4. ROOM-REQUIRED FIRST
            // ==================================================

            const requiresRoomA =
                Boolean(
                    a?.requiresRoom
                );


            const requiresRoomB =
                Boolean(
                    b?.requiresRoom
                );


            if (
                requiresRoomA !==
                requiresRoomB
            ) {

                return requiresRoomA
                    ? -1
                    : 1;

            }


            // ==================================================
            // 5. FEWER COMPATIBLE ROOMS FIRST
            // ==================================================

            if (
                requiresRoomA &&
                requiresRoomB
            ) {

                const roomsA =
                    getTaskCompatibleRoomCount(
                        a,
                        rooms
                    );


                const roomsB =
                    getTaskCompatibleRoomCount(
                        b,
                        rooms
                    );


                if (
                    roomsA !==
                    roomsB
                ) {

                    return (
                        roomsA -
                        roomsB
                    );

                }

            }


            // ==================================================
            // 6. RESTRICTIVE DAILY LIMIT FIRST
            // ==================================================

            const dailyA =
                Number(
                    a?.maxLessonsPerDay
                ) || 999;


            const dailyB =
                Number(
                    b?.maxLessonsPerDay
                ) || 999;


            if (
                dailyA !==
                dailyB
            ) {

                return (
                    dailyA -
                    dailyB
                );

            }


            // ==================================================
            // 7. DETERMINISTIC TASK ID
            // ========================================================
            //
            // Do NOT use Math.random() here.
            //
            // Deterministic ordering makes timetable audit
            // failures reproducible.
            //
            // ==================================================

            const taskIdA =
                normalizeTimetableId(
                    a?.taskId
                );


            const taskIdB =
                normalizeTimetableId(
                    b?.taskId
                );


            return taskIdA.localeCompare(
                taskIdB
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

                roomTypeId:
                    task.roomTypeId ||
                    null,

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
// CALCULATE TASK PRIORITY SCORE
// ============================================================
//
// Calculates how difficult/restrictive a task is to place.
//
// IMPORTANT:
// This function must remain consistent with the more detailed
// getTaskPriorityScore() logic.
//
// Parallel metadata is NOT given an artificial score here.
// Parallel tasks are grouped deterministically by the sorter.
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

    if (
        task.taskType === "double" ||
        task.isDouble === true
    ) {

        score += 100;

    }


    // ========================================================
    // 2. ROOM REQUIRED
    // ========================================================

    if (
        task.requiresRoom
    ) {

        score += 50;

    }


    // ========================================================
    // 3. SPECIALIZED ROOM TYPE
    // ========================================================
    //
    // Do NOT treat every roomTypeId as specialized.
    //
    // A normal classroom may also have a roomTypeId.
    //
    // ========================================================

    const normalizedRoomType =
        normalizeRoomType(
            task.roomType
        );


    const isSpecializedRoom =
        Boolean(
            normalizedRoomType &&
            normalizedRoomType !== "classroom" &&
            normalizedRoomType !== "none"
        );


    if (
        isSpecializedRoom
    ) {

        score += 25;

    }


    // ========================================================
    // 4. TEACHER ASSIGNED
    // ========================================================

    if (
        task.teacherId
    ) {

        score += 15;

    }


    // ========================================================
    // 5. DAILY LIMIT
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

    const duration =
        Number(
            task.duration
        ) || 0;


    if (
        duration >= 2
    ) {

        score += 20;

    }


    // ========================================================
    // 7. FEW COMPATIBLE ROOMS
    // ========================================================
    //
    // Fewer compatible rooms = greater restriction.
    //
    // This supplements the base room-required score.
    //
    // ========================================================

    if (
        task.requiresRoom &&
        Array.isArray(data.rooms)
    ) {

        const compatibleRoomCount =
            getTaskCompatibleRoomCount(
                task,
                data.rooms
            );


        if (
            compatibleRoomCount === 0
        ) {

            score += 1000;

        }
        else {

            score += Math.max(
                0,
                30 -
                (
                    compatibleRoomCount *
                    5
                )
            );

        }

    }


    // ========================================================
    // 8. WEEKLY FREQUENCY
    // ========================================================
    //
    // Higher-frequency requirements consume more timetable
    // space and therefore receive slightly higher priority.
    //
    // ========================================================

    let lessonsPerWeek = 0;

    const requirement =
        getTaskRequirement(
            task,
            data.lookup
        );


    if (
        requirement
    ) {

        lessonsPerWeek =
            Number(
                requirement.lessonsPerWeek
            ) || 0;

    }


    score += Math.min(
        lessonsPerWeek * 5,
        30
    );


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
// IMPORTANT:
// - No Math.random()
// - Deterministic
// - Parallel occurrences remain grouped
// - Hard tasks remain first
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


    sorted.sort(
        (
            a,
            b
        ) => {

            const taskA =
                a.task;

            const taskB =
                b.task;


            // ==================================================
            // 1. PRIORITY SCORE
            // ==================================================

            if (
                b.priority !==
                a.priority
            ) {

                return (
                    b.priority -
                    a.priority
                );

            }


            // ==================================================
            // 2. PARALLEL GROUP
            // ==================================================
            //
            // Keep members of the same parallel group together.
            //
            // Empty groups sort after explicit groups.
            //
            // ==================================================

            const groupA =
                getTaskParallelGroup(
                    taskA
                );


            const groupB =
                getTaskParallelGroup(
                    taskB
                );


            if (
                groupA !==
                groupB
            ) {

                if (
                    !groupA
                ) {

                    return 1;

                }


                if (
                    !groupB
                ) {

                    return -1;

                }


                const groupCompare =
                    groupA.localeCompare(
                        groupB
                    );


                if (
                    groupCompare !== 0
                ) {

                    return groupCompare;

                }

            }


            // ==================================================
            // 3. PARALLEL OCCURRENCE
            // ==================================================
            //
            // O1 must remain before O2, O2 before O3, etc.
            //
            // This is especially important for double lessons:
            //
            //     O1-O2
            //     O3-O4
            //
            // ==================================================

            const occurrenceA =
                Number(
                    taskA?.parallelOccurrence
                );


            const occurrenceB =
                Number(
                    taskB?.parallelOccurrence
                );


            const hasOccurrenceA =
                Number.isFinite(
                    occurrenceA
                );


            const hasOccurrenceB =
                Number.isFinite(
                    occurrenceB
                );


            if (
                hasOccurrenceA &&
                hasOccurrenceB &&
                occurrenceA !== occurrenceB
            ) {

                return (
                    occurrenceA -
                    occurrenceB
                );

            }


            if (
                hasOccurrenceA !==
                hasOccurrenceB
            ) {

                return hasOccurrenceA
                    ? -1
                    : 1;

            }


            // ==================================================
            // 4. PARALLEL OCCURRENCE KEY
            // ==================================================

            const occurrenceKeyA =
                getTaskParallelOccurrenceKey(
                    taskA
                );


            const occurrenceKeyB =
                getTaskParallelOccurrenceKey(
                    taskB
                );


            if (
                occurrenceKeyA !==
                occurrenceKeyB
            ) {

                if (
                    !occurrenceKeyA
                ) {

                    return 1;

                }


                if (
                    !occurrenceKeyB
                ) {

                    return -1;

                }


                const occurrenceCompare =
                    occurrenceKeyA.localeCompare(
                        occurrenceKeyB
                    );


                if (
                    occurrenceCompare !== 0
                ) {

                    return occurrenceCompare;

                }

            }


            // ==================================================
            // 5. DOUBLE LESSON FIRST
            // ==================================================

            const aIsDouble =
                taskA?.taskType === "double" ||
                taskA?.isDouble === true;


            const bIsDouble =
                taskB?.taskType === "double" ||
                taskB?.isDouble === true;


            if (
                aIsDouble !==
                bIsDouble
            ) {

                return aIsDouble
                    ? -1
                    : 1;

            }


            // ==================================================
            // 6. LONGER DURATION FIRST
            // ==================================================

            const durationA =
                Number(
                    taskA?.duration
                ) || 0;


            const durationB =
                Number(
                    taskB?.duration
                ) || 0;


            if (
                durationA !==
                durationB
            ) {

                return (
                    durationB -
                    durationA
                );

            }


            // ==================================================
            // 7. ROOM REQUIRED FIRST
            // ==================================================

            const requiresRoomA =
                Boolean(
                    taskA?.requiresRoom
                );


            const requiresRoomB =
                Boolean(
                    taskB?.requiresRoom
                );


            if (
                requiresRoomA !==
                requiresRoomB
            ) {

                return requiresRoomA
                    ? -1
                    : 1;

            }


            // ==================================================
            // 8. FEWER COMPATIBLE ROOMS FIRST
            // ==================================================

            if (
                requiresRoomA &&
                requiresRoomB
            ) {

                const roomsA =
                    getTaskCompatibleRoomCount(
                        taskA,
                        data.rooms
                    );


                const roomsB =
                    getTaskCompatibleRoomCount(
                        taskB,
                        data.rooms
                    );


                if (
                    roomsA !==
                    roomsB
                ) {

                    return (
                        roomsA -
                        roomsB
                    );

                }

            }


            // ==================================================
            // 9. RESTRICTIVE DAILY LIMIT FIRST
            // ==================================================

            const dailyA =
                Number(
                    taskA?.maxLessonsPerDay
                ) || 999;


            const dailyB =
                Number(
                    taskB?.maxLessonsPerDay
                ) || 999;


            if (
                dailyA !==
                dailyB
            ) {

                return (
                    dailyA -
                    dailyB
                );

            }


            // ==================================================
            // 10. STREAM
            // ==================================================
            //
            // Deterministic grouping by stream.
            //
            // ==================================================

            const streamA =
                normalizeTimetableId(
                    taskA?.streamId
                );


            const streamB =
                normalizeTimetableId(
                    taskB?.streamId
                );


            if (
                streamA !==
                streamB
            ) {

                return streamA.localeCompare(
                    streamB
                );

            }


            // ==================================================
            // 11. SUBJECT
            // ==================================================

            const subjectA =
                normalizeTimetableId(
                    taskA?.subjectId
                );


            const subjectB =
                normalizeTimetableId(
                    taskB?.subjectId
                );


            if (
                subjectA !==
                subjectB
            ) {

                return subjectA.localeCompare(
                    subjectB
                );

            }


            // ==================================================
            // 12. FINAL DETERMINISTIC TASK ID
            // ==================================================

            const taskIdA =
                normalizeTimetableId(
                    taskA?.taskId
                );


            const taskIdB =
                normalizeTimetableId(
                    taskB?.taskId
                );


            return taskIdA.localeCompare(
                taskIdB
            );

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

                streamId:
                    task.streamId,

                subjectId:
                    task.subjectId,

                teacherId:
                    task.teacherId,

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
                    getTaskParallelGroup(
                        task
                    ),

                parallelOccurrenceKey:
                    getTaskParallelOccurrenceKey(
                        task
                    ),

                parallelOccurrence:
                    task.parallelOccurrence,

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
    // THIS HELPER USES GLOBAL OCCUPANCY WHEN AVAILABLE
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


            periodMap.set(
                normalizeTimetableId(
                    period.id
                ),
                period
            );

        }
    );


    // ========================================================
    // UNIQUE SESSION SET
    // ========================================================
    //
    // Key:
    //
    //     periodId + subjectId
    //
    // Teacher ID is already fixed by the function argument.
    //
    // ========================================================

    const uniqueSessions =
        new Set();


    // ========================================================
    // PREFERRED SOURCE:
    // TEACHER PERIOD LESSON DETAILS
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
                // A teacher's multiple entries in this period
                // may represent concurrent teaching of the same
                // subject to different streams.
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


                        // ------------------------------------------------
                        // Subject is the important session identity.
                        //
                        // If subject is missing, use the task/lesson
                        // identity as a safe fallback rather than
                        // incorrectly merging unrelated lessons.
                        // ------------------------------------------------

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
    //
    // Older occupancy data may not have teacherPeriodLessons.
    //
    // In that case, count teacher-period occupancy directly.
    // This is less precise for concurrent shared teaching, but
    // preserves compatibility.
    //
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

                const prefix =
                    `${normalizedTeacherId}__`;


                if (
                    !teacherPeriodKey.startsWith(
                        prefix
                    )
                ) {

                    return;

                }


                if (
                    !Array.isArray(lessons)
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
// Therefore this function evaluates SLOT QUALITY,
// not basic validity.
//
// Parallel synchronization is occurrence-aware:
//
//     parallelGroup
//     +
//     parallelOccurrenceKey
//
// must both match.
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
    // PARALLEL IDENTITY
    // ========================================================
    //
    // A valid explicit parallel occurrence is identified by:
    //
    //     parallelGroup
    //     +
    //     parallelOccurrenceKey
    //
    // Example:
    //
    //     BIO/PHY__O1
    //     BIO/PHY__O2
    //
    // These are different synchronization identities.
    //
    // ========================================================

    const taskParallelGroup =
        getTaskParallelGroup(
            task
        );


    const taskParallelOccurrenceKey =
        getTaskParallelOccurrenceKey(
            task
        );


    const taskParallelIdentity =
        getTaskParallelIdentity(
            task
        );


    // ========================================================
    // PARALLEL GROUP SYNCHRONIZATION
    // ========================================================
    //
    // Search SCHOOL-WIDE occupancy.
    //
    // Do NOT search only the current stream.
    //
    // A parallel group may contain:
    //
    //     10E
    //     10M
    //     10L
    //     10T
    //
    // Therefore an existing matching occurrence in ANY
    // participating stream should make this period attractive.
    //
    // IMPORTANT:
    //
    // Same group alone is NOT enough.
    //
    // We require:
    //
    //     same group
    //     same occurrence key
    //
    // ========================================================

    let parallelGroupMatches =
        0;


    if (
        taskParallelGroup &&
        taskParallelOccurrenceKey &&
        indexes.streamPeriodLessons instanceof Map
    ) {

        const candidatePeriodId =
            normalizeTimetableId(
                period.id
            );


        indexes.streamPeriodLessons.forEach(
            lessons => {

                if (
                    !Array.isArray(lessons)
                ) {

                    return;

                }


                lessons.forEach(
                    existingLesson => {

                        if (
                            !existingLesson
                        ) {

                            return;

                        }


                        const existingPeriodId =
                            normalizeTimetableId(
                                existingLesson.periodId ??
                                existingLesson.period_id
                            );


                        if (
                            existingPeriodId !==
                            candidatePeriodId
                        ) {

                            return;

                        }


                        const existingParallelGroup =
                            getTaskParallelGroup(
                                existingLesson
                            );


                        const existingOccurrenceKey =
                            getTaskParallelOccurrenceKey(
                                existingLesson
                            );


                        if (
                            existingParallelGroup !==
                            taskParallelGroup
                        ) {

                            return;

                        }


                        if (
                            existingOccurrenceKey !==
                            taskParallelOccurrenceKey
                        ) {

                            return;

                        }


                        const existingIdentity =
                            getTaskParallelIdentity(
                                existingLesson
                            );


                        if (
                            taskParallelIdentity &&
                            existingIdentity &&
                            existingIdentity !==
                                taskParallelIdentity
                        ) {

                            return;

                        }


                        parallelGroupMatches++;

                    }
                );

            }
        );

    }


    if (
        parallelGroupMatches > 0
    ) {

        // ----------------------------------------------------
        // VERY STRONG PREFERENCE
        // ----------------------------------------------------

        score +=
            1000;


        reasons.push(
            "Matches the same parallel group and occurrence already scheduled in this period."
        );

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
            data.lookup?.teachers?.get(
                normalizeTimetableId(
                    task.teacherId
                )
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
        Array.isArray(data.periods)
            ? data.periods.filter(
                item =>
                    Number(
                        item.dayNumber
                    ) ===
                    dayNumber
            )
            : [];


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
        room.id &&
        indexes.roomPeriod instanceof Set
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
                    String(key).startsWith(
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
// GET SCORED SINGLE LESSON CANDIDATES
// ============================================================

// ============================================================
// GET SCORED SINGLE LESSON CANDIDATES
// ============================================================
//
// Returns all valid single-lesson candidates.
//
// Parallel synchronization is SCHOOL-WIDE and
// OCCURRENCE-AWARE.
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
            Array.isArray(data.periods)
                ? data.periods
                : []
        );


    const compatibleRooms =
        getCompatibleRooms(
            task,
            Array.isArray(data.rooms)
                ? data.rooms
                : []
        );


    if (
        task.requiresRoom &&
        compatibleRooms.length === 0
    ) {

        return [];

    }


    const candidates = [];


    // ========================================================
    // PARALLEL IDENTITY
    // ========================================================

    const taskParallelGroup =
        getTaskParallelGroup(
            task
        );


    const taskParallelOccurrenceKey =
        getTaskParallelOccurrenceKey(
            task
        );


    const taskParallelIdentity =
        getTaskParallelIdentity(
            task
        );


    // ========================================================
    // BUILD SCHOOL-WIDE SYNCHRONIZED PERIOD SET
    // ========================================================
    //
    // We scan streamPeriodLessons because it contains the
    // detailed lesson metadata for every stream.
    //
    // A period qualifies as synchronized when another lesson
    // with the SAME:
    //
    //     parallelGroup
    //     +
    //     parallelOccurrenceKey
    //
    // already occupies that period.
    //
    // ========================================================

    const synchronizedPeriodIds =
        new Set();


    if (
        taskParallelGroup &&
        taskParallelOccurrenceKey &&
        indexes.streamPeriodLessons instanceof Map
    ) {

        indexes.streamPeriodLessons.forEach(
            lessons => {

                if (
                    !Array.isArray(lessons)
                ) {

                    return;

                }


                lessons.forEach(
                    existingLesson => {

                        if (
                            !existingLesson
                        ) {

                            return;

                        }


                        const existingParallelGroup =
                            getTaskParallelGroup(
                                existingLesson
                            );


                        if (
                            existingParallelGroup !==
                            taskParallelGroup
                        ) {

                            return;

                        }


                        const existingOccurrenceKey =
                            getTaskParallelOccurrenceKey(
                                existingLesson
                            );


                        if (
                            existingOccurrenceKey !==
                            taskParallelOccurrenceKey
                        ) {

                            return;

                        }


                        const existingIdentity =
                            getTaskParallelIdentity(
                                existingLesson
                            );


                        if (
                            taskParallelIdentity &&
                            existingIdentity &&
                            existingIdentity !==
                                taskParallelIdentity
                        ) {

                            return;

                        }


                        const existingPeriodId =
                            normalizeTimetableId(
                                existingLesson.periodId ??
                                existingLesson.period_id
                            );


                        if (
                            existingPeriodId
                        ) {

                            synchronizedPeriodIds.add(
                                existingPeriodId
                            );

                        }

                    }
                );

            }
        );

    }


    // ========================================================
    // TEST EVERY TEACHING PERIOD
    // ========================================================

    teachingPeriods.forEach(
        period => {

            if (
                !period ||
                !period.id
            ) {

                return;

            }


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


                    const periodId =
                        normalizeTimetableId(
                            period.id
                        );


                    const isSynchronized =
                        Boolean(
                            taskParallelGroup &&
                            taskParallelOccurrenceKey &&
                            synchronizedPeriodIds.has(
                                periodId
                            )
                        );


                    let score =
                        Number(
                            scoring?.score
                        ) || 0;


                    const reasons =
                        Array.isArray(
                            scoring?.reasons
                        )
                            ? [
                                ...scoring.reasons
                            ]
                            : [];


                    // =================================================
                    // STRONG PARALLEL SYNCHRONIZATION PREFERENCE
                    // =================================================

                    if (
                        isSynchronized
                    ) {

                        score +=
                            100000;


                        reasons.push(
                            "Matches the same parallel group and occurrence already scheduled in this period."
                        );

                    }


                    candidates.push({

                        taskId:
                            task.taskId,

                        period,

                        room,

                        score,

                        reasons,

                        isParallelSynchronized:
                            isSynchronized,

                        parallelGroup:
                            taskParallelGroup ||
                            null,

                        parallelOccurrenceKey:
                            taskParallelOccurrenceKey ||
                            null,

                        parallelIdentity:
                            taskParallelIdentity ||
                            null

                    });

                }
            );

        }
    );


    // ========================================================
    // DETERMINISTIC SORT
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


            const aDay =
                Number(
                    a.period?.dayNumber
                ) || 0;


            const bDay =
                Number(
                    b.period?.dayNumber
                ) || 0;


            if (
                aDay !==
                bDay
            ) {

                return (
                    aDay -
                    bDay
                );

            }


            const aPeriodOrder =
                Number(
                    a.period?.periodOrder
                ) || 0;


            const bPeriodOrder =
                Number(
                    b.period?.periodOrder
                ) || 0;


            if (
                aPeriodOrder !==
                bPeriodOrder
            ) {

                return (
                    aPeriodOrder -
                    bPeriodOrder
                );

            }


            const aPeriodId =
                normalizeTimetableId(
                    a.period?.id
                );


            const bPeriodId =
                normalizeTimetableId(
                    b.period?.id
                );


            if (
                aPeriodId !==
                bPeriodId
            ) {

                return aPeriodId.localeCompare(
                    bPeriodId
                );

            }


            const aRoomId =
                normalizeTimetableId(
                    a.room?.id
                );


            const bRoomId =
                normalizeTimetableId(
                    b.room?.id
                );


            return aRoomId.localeCompare(
                bRoomId
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
// STAGE 6D — CALCULATE DOUBLE LESSON CANDIDATE SCORE
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
    // PARALLEL IDENTITY
    // ========================================================
    //
    // Explicit parallel synchronization requires BOTH:
    //
    //     parallelGroup
    //     +
    //     parallelOccurrenceKey
    //
    // Example:
    //
    //     BIO/PHY + O1
    //
    // is different from:
    //
    //     BIO/PHY + O2
    //
    // ========================================================

    const taskParallelGroup =
        getTaskParallelGroup(
            task
        );


    const taskParallelOccurrenceKey =
        getTaskParallelOccurrenceKey(
            task
        );


    const taskParallelIdentity =
        getTaskParallelIdentity(
            task
        );


    // ========================================================
    // PARALLEL SYNCHRONIZATION
    // ========================================================
    //
    // Search the SCHOOL-WIDE stream occupancy.
    //
    // A parallel group may contain:
    //
    //     10E
    //     10M
    //     10L
    //     10T
    //
    // Therefore we must not restrict the search to the current
    // stream.
    //
    // A synchronization match is valid only when:
    //
    //     same parallel group
    //     AND
    //     same occurrence key
    //
    // ========================================================

    let firstPeriodSynchronized =
        false;


    let secondPeriodSynchronized =
        false;


    if (
        taskParallelGroup &&
        taskParallelOccurrenceKey &&
        indexes.streamPeriodLessons instanceof Map
    ) {

        const firstPeriodId =
            normalizeTimetableId(
                firstPeriod.id
            );


        const secondPeriodId =
            normalizeTimetableId(
                secondPeriod.id
            );


        indexes.streamPeriodLessons.forEach(
            lessons => {

                if (
                    !Array.isArray(lessons)
                ) {

                    return;

                }


                lessons.forEach(
                    existingLesson => {

                        if (
                            !existingLesson
                        ) {

                            return;

                        }


                        const existingParallelGroup =
                            getTaskParallelGroup(
                                existingLesson
                            );


                        if (
                            existingParallelGroup !==
                            taskParallelGroup
                        ) {

                            return;

                        }


                        const existingOccurrenceKey =
                            getTaskParallelOccurrenceKey(
                                existingLesson
                            );


                        if (
                            existingOccurrenceKey !==
                            taskParallelOccurrenceKey
                        ) {

                            return;

                        }


                        const existingIdentity =
                            getTaskParallelIdentity(
                                existingLesson
                            );


                        if (
                            taskParallelIdentity &&
                            existingIdentity &&
                            existingIdentity !==
                                taskParallelIdentity
                        ) {

                            return;

                        }


                        const existingPeriodId =
                            normalizeTimetableId(
                                existingLesson.periodId ??
                                existingLesson.period_id
                            );


                        if (
                            existingPeriodId ===
                            firstPeriodId
                        ) {

                            firstPeriodSynchronized =
                                true;

                        }


                        if (
                            existingPeriodId ===
                            secondPeriodId
                        ) {

                            secondPeriodSynchronized =
                                true;

                        }

                    }
                );

            }
        );

    }


    // ========================================================
    // SYNCHRONIZATION SCORE
    // ========================================================

    if (
        firstPeriodSynchronized &&
        secondPeriodSynchronized
    ) {

        score +=
            100000;


        reasons.push(
            "Both periods match the same parallel group and occurrence already scheduled."
        );

    }
    else if (
        firstPeriodSynchronized ||
        secondPeriodSynchronized
    ) {

        score +=
            50000;


        reasons.push(
            "One period matches the same parallel group and occurrence already scheduled."
        );

    }


    // ========================================================
    // DAY
    // ========================================================

    const dayNumber =
        Number(
            firstPeriod.dayNumber
        );


    // ========================================================
    // REQUIREMENT DAILY LOAD
    // ========================================================

    const requirementId =
        normalizeTimetableId(
            task.requirementId ??
            task.requirement_id
        );


    const currentRequirementDailyCount =
        getDailyRequirementLessonCount(
            indexes,
            requirementId,
            dayNumber
        );


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

    const streamId =
        normalizeTimetableId(
            task.streamId ??
            task.stream_id
        );


    const streamDailyCount =
        getStreamDailyLessonCount(
            indexes,
            streamId,
            dayNumber,
            Array.isArray(data.periods)
                ? data.periods
                : []
        );


    // --------------------------------------------------------
    // IMPORTANT:
    //
    // A double lesson occupies TWO timetable periods but
    // represents ONE lesson occurrence for the requirement.
    //
    // For stream workload, however, both periods are occupied.
    // --------------------------------------------------------

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

    const teacherId =
        normalizeTimetableId(
            task.teacherId ??
            task.teacher_id
        );


    let teacher = null;


    if (
        teacherId
    ) {

        if (
            data.lookup?.teachers instanceof Map
        ) {

            teacher =
                data.lookup.teachers.get(
                    teacherId
                ) ||
                data.lookup.teachers.get(
                    task.teacherId
                ) ||
                data.lookup.teachers.get(
                    task.teacher_id
                );

        }


        const teacherDailyCount =
            getTeacherDailyLessonCountFromPeriods(
                indexes,
                teacherId,
                dayNumber,
                Array.isArray(data.periods)
                    ? data.periods
                    : []
            );


        // ====================================================
        // CHECK WHETHER THIS DOUBLE IS A SHARED SESSION
        // ====================================================

        let firstPeriodSharedConcurrent =
            false;


        let secondPeriodSharedConcurrent =
            false;


        if (
            indexes.teacherPeriodLessons instanceof Map
        ) {

            const firstTeacherPeriodKey =
                `${teacherId}__${normalizeTimetableId(
                    firstPeriod.id
                )}`;


            const secondTeacherPeriodKey =
                `${teacherId}__${normalizeTimetableId(
                    secondPeriod.id
                )}`;


            const firstLessons =
                indexes.teacherPeriodLessons.get(
                    firstTeacherPeriodKey
                ) ||
                [];


            const secondLessons =
                indexes.teacherPeriodLessons.get(
                    secondTeacherPeriodKey
                ) ||
                [];


            if (
                firstLessons.length > 0
            ) {

                firstPeriodSharedConcurrent =
                    firstLessons.every(
                        existingLesson =>
                            areConcurrentTeacherLessonsAllowed(
                                task,
                                existingLesson
                            )
                    );

            }


            if (
                secondLessons.length > 0
            ) {

                secondPeriodSharedConcurrent =
                    secondLessons.every(
                        existingLesson =>
                            areConcurrentTeacherLessonsAllowed(
                                task,
                                existingLesson
                            )
                    );

            }

        }


        // ----------------------------------------------------
        // A concurrent lesson occupies the teacher's period,
        // but does not create another teacher session.
        //
        // For a double:
        //
        // P1 shared + P2 shared = 0 new sessions
        // P1 shared + P2 new    = 1 new session
        // P1 new    + P2 new    = 2 new sessions
        // ----------------------------------------------------

        const teacherSessionIncrement =
            (
                firstPeriodSharedConcurrent
                    ? 0
                    : 1
            ) +
            (
                secondPeriodSharedConcurrent
                    ? 0
                    : 1
            );


        const projectedTeacherDailyCount =
            teacherDailyCount +
            teacherSessionIncrement;


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


        if (
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
        teacherId
    ) {

        const weeklyCount =
            getTeacherWeeklyLessonCount(
                indexes,
                teacherId
            );


        const weeklyLimit =
            Number(
                teacher?.maxLessonsPerWeek
            ) || 0;


        if (
            weeklyLimit > 0
        ) {

            // ------------------------------------------------
            // A double normally creates ONE lesson session,
            // not two weekly teaching sessions.
            //
            // Concurrent teaching creates zero additional
            // sessions.
            //
            // ------------------------------------------------

            let weeklyIncrement =
                1;


            if (
                indexes.teacherPeriodLessons instanceof Map
            ) {

                const firstKey =
                    `${teacherId}__${normalizeTimetableId(
                        firstPeriod.id
                    )}`;


                const secondKey =
                    `${teacherId}__${normalizeTimetableId(
                        secondPeriod.id
                    )}`;


                const firstLessons =
                    indexes.teacherPeriodLessons.get(
                        firstKey
                    ) ||
                    [];


                const secondLessons =
                    indexes.teacherPeriodLessons.get(
                        secondKey
                    ) ||
                    [];


                const firstShared =
                    firstLessons.length > 0 &&
                    firstLessons.every(
                        existingLesson =>
                            areConcurrentTeacherLessonsAllowed(
                                task,
                                existingLesson
                            )
                    );


                const secondShared =
                    secondLessons.length > 0 &&
                    secondLessons.every(
                        existingLesson =>
                            areConcurrentTeacherLessonsAllowed(
                                task,
                                existingLesson
                            )
                    );


                if (
                    firstShared &&
                    secondShared
                ) {

                    weeklyIncrement = 0;

                }

            }


            const projectedWeeklyCount =
                weeklyCount +
                weeklyIncrement;


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

    const dayPeriods =
        Array.isArray(data.periods)
            ? data.periods.filter(
                period =>
                    Number(
                        period?.dayNumber
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
        room?.id &&
        indexes.roomPeriod instanceof Set
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
                    String(key).startsWith(
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
    // SAME DAY
    // ========================================================

    if (
        Number(firstPeriod.dayNumber) ===
        Number(secondPeriod.dayNumber)
    ) {

        score += 10;

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
// GET SCORED DOUBLE LESSON CANDIDATES
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


    const periods =
        Array.isArray(data.periods)
            ? data.periods
            : [];


    if (
        periods.length === 0
    ) {

        return [];

    }


    // ========================================================
    // PARALLEL IDENTITY
    // ========================================================
    //
    // A parallel task must follow the already established
    // school-wide synchronization point.
    //
    // Identity =
    //
    //     parallelGroup
    //     +
    //     parallelOccurrenceKey
    //
    // Example:
    //
    //     BIO/PHY__O1
    //     BIO/PHY__O2
    //
    // O1 and O2 MUST NOT be treated as interchangeable.
    //
    // ========================================================

    const taskParallelGroup =
        getTaskParallelGroup(
            task
        );


    const taskParallelOccurrenceKey =
        getTaskParallelOccurrenceKey(
            task
        );


    const taskParallelIdentity =
        getTaskParallelIdentity(
            task
        );


    const isExplicitParallelTask =
        Boolean(
            taskParallelGroup &&
            taskParallelOccurrenceKey &&
            taskParallelIdentity
        );


    // ========================================================
    // GET ALL CONSECUTIVE TEACHING PAIRS
    // ========================================================

    const pairs =
        getConsecutiveTeachingPeriodPairs(
            periods
        );


    if (
        pairs.length === 0
    ) {

        return [];

    }


    // ========================================================
    // COMPATIBLE ROOMS
    // ========================================================

    const compatibleRooms =
        getCompatibleRooms(
            task,
            Array.isArray(data.rooms)
                ? data.rooms
                : []
        );


    if (
        task.requiresRoom &&
        compatibleRooms.length === 0
    ) {

        return [];

    }


    // ========================================================
    // CANDIDATE LIST
    // ========================================================

    const candidates = [];


    // ========================================================
    // HELPER:
    //
    // Determine whether an existing lesson belongs to the same
    // explicit parallel occurrence.
    //
    // ========================================================

    function isSameParallelOccurrence(
        existingLesson
    ) {

        if (
            !isExplicitParallelTask ||
            !existingLesson
        ) {

            return false;

        }


        const existingParallelGroup =
            getTaskParallelGroup(
                existingLesson
            );


        if (
            existingParallelGroup !==
            taskParallelGroup
        ) {

            return false;

        }


        const existingOccurrenceKey =
            getTaskParallelOccurrenceKey(
                existingLesson
            );


        if (
            existingOccurrenceKey !==
            taskParallelOccurrenceKey
        ) {

            return false;

        }


        const existingIdentity =
            getTaskParallelIdentity(
                existingLesson
            );


        if (
            existingIdentity &&
            existingIdentity !==
                taskParallelIdentity
        ) {

            return false;

        }


        return true;

    }


    // ========================================================
    // HELPER:
    //
    // Find whether this period already contains a lesson from
    // the same parallel group + occurrence.
    //
    // IMPORTANT:
    //
    // streamPeriodLessons is school-wide.
    //
    // Therefore this works across:
    //
    //     10E
    //     10M
    //     10L
    //     10T
    //
    // rather than only inside the current stream.
    //
    // ========================================================

    function hasParallelOccurrenceAtPeriod(
        period
    ) {

        if (
            !period ||
            !(indexes.streamPeriodLessons instanceof Map)
        ) {

            return false;

        }


        const periodId =
            normalizeTimetableId(
                period.id
            );


        if (
            !periodId
        ) {

            return false;

        }


        let found = false;


        indexes.streamPeriodLessons.forEach(
            lessons => {

                if (
                    found ||
                    !Array.isArray(lessons)
                ) {

                    return;

                }


                lessons.forEach(
                    existingLesson => {

                        if (
                            found ||
                            !existingLesson
                        ) {

                            return;

                        }


                        const existingPeriodId =
                            normalizeTimetableId(
                                existingLesson.periodId ??
                                existingLesson.period_id
                            );


                        if (
                            existingPeriodId !==
                            periodId
                        ) {

                            return;

                        }


                        if (
                            isSameParallelOccurrence(
                                existingLesson
                            )
                        ) {

                            found = true;

                        }

                    }
                );

            }
        );


        return found;

    }


    // ========================================================
    // HELPER:
    //
    // Determine whether the candidate pair is the same
    // synchronized pair already used by another member of the
    // parallel group.
    //
    // ========================================================

    function getParallelPairSynchronizationState(
        firstPeriod,
        secondPeriod
    ) {

        const firstSynchronized =
            hasParallelOccurrenceAtPeriod(
                firstPeriod
            );


        const secondSynchronized =
            hasParallelOccurrenceAtPeriod(
                secondPeriod
            );


        return {

            firstSynchronized,

            secondSynchronized,

            fullySynchronized:
                firstSynchronized &&
                secondSynchronized,

            partiallySynchronized:
                firstSynchronized ||
                secondSynchronized

        };

    }


    // ========================================================
    // PROCESS PERIOD PAIRS
    // ========================================================

    pairs.forEach(
        pair => {

            if (
                !pair?.first ||
                !pair?.second
            ) {

                return;

            }


            // ==================================================
            // EXPLICIT PARALLEL TASK
            // ==================================================
            //
            // If another member of this parallel occurrence has
            // already been placed, the new double must use the
            // EXACT same pair.
            //
            // A candidate where only one period matches is not
            // accepted here.
            //
            // This prevents:
            //
            //     10E BIO/PHY O1 -> P2+P3
            //
            // while:
            //
            //     10M BIO/PHY O1 -> P5+P6
            //
            // ==================================================

            if (
                isExplicitParallelTask
            ) {

                const sync =
                    getParallelPairSynchronizationState(
                        pair.first,
                        pair.second
                    );


                if (
                    sync.partiallySynchronized &&
                    !sync.fullySynchronized
                ) {

                    return;

                }

            }


            // ==================================================
            // ROOM OPTIONS
            // ==================================================

            const candidateRooms =
                task.requiresRoom
                    ? compatibleRooms
                    : [null];


            candidateRooms.forEach(
                room => {

                    // ==========================================
                    // FINAL CONFLICT CHECK
                    // ==========================================

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


                    // ==========================================
                    // SCORE
                    // ==========================================

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

                        taskType:
                            task.taskType,

                        streamId:
                            task.streamId,

                        subjectId:
                            task.subjectId,

                        teacherId:
                            task.teacherId,

                        requirementId:
                            task.requirementId,

                        parallelGroup:
                            taskParallelGroup ||
                            null,

                        parallelOccurrenceKey:
                            taskParallelOccurrenceKey ||
                            null,

                        parallelIdentity:
                            taskParallelIdentity ||
                            null,

                        firstPeriod:
                            pair.first,

                        secondPeriod:
                            pair.second,

                        room,

                        synchronized:
                            isExplicitParallelTask
                                ? hasParallelOccurrenceAtPeriod(
                                    pair.first
                                ) &&
                                  hasParallelOccurrenceAtPeriod(
                                    pair.second
                                )
                                : false,

                        score:
                            Number(
                                scoring?.score
                            ) || 0,

                        reasons:
                            Array.isArray(
                                scoring?.reasons
                            )
                                ? [
                                    ...scoring.reasons
                                ]
                                : []

                    });

                }
            );

        }
    );


    // ========================================================
    // DETERMINISTIC SORT
    // ========================================================
    //
    // Priority:
    //
    // 1. Higher score
    // 2. Fully synchronized parallel pair
    // 3. Earlier day
    // 4. Earlier first period
    // 5. Earlier second period
    // 6. Stable room ID
    //
    // No Math.random().
    //
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


            const aSynchronized =
                a.synchronized
                    ? 1
                    : 0;


            const bSynchronized =
                b.synchronized
                    ? 1
                    : 0;


            if (
                bSynchronized !==
                aSynchronized
            ) {

                return (
                    bSynchronized -
                    aSynchronized
                );

            }


            const aDay =
                Number(
                    a.firstPeriod?.dayNumber
                );


            const bDay =
                Number(
                    b.firstPeriod?.dayNumber
                );


            if (
                aDay !==
                bDay
            ) {

                return (
                    aDay -
                    bDay
                );

            }


            const aFirstOrder =
                Number(
                    a.firstPeriod?.periodOrder
                );


            const bFirstOrder =
                Number(
                    b.firstPeriod?.periodOrder
                );


            if (
                aFirstOrder !==
                bFirstOrder
            ) {

                return (
                    aFirstOrder -
                    bFirstOrder
                );

            }


            const aSecondOrder =
                Number(
                    a.secondPeriod?.periodOrder
                );


            const bSecondOrder =
                Number(
                    b.secondPeriod?.periodOrder
                );


            if (
                aSecondOrder !==
                bSecondOrder
            ) {

                return (
                    aSecondOrder -
                    bSecondOrder
                );

            }


            const aRoomId =
                String(
                    normalizeTimetableId(
                        a.room?.id
                    ) ||
                    ""
                );


            const bRoomId =
                String(
                    normalizeTimetableId(
                        b.room?.id
                    ) ||
                    ""
                );


            return aRoomId.localeCompare(
                bRoomId
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
// STAGE 6E — GET SMART CANDIDATES FOR TASK
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


    if (
        task.taskType === "double"
    ) {

        return getScoredDoubleLessonCandidates(
            task,
            data,
            indexes
        );

    }


    return getScoredSingleLessonCandidates(
        task,
        data,
        indexes
    );

}


// ============================================================
// GET BEST SMART CANDIDATE
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
                Array.isArray(
                    candidate.reasons
                )
                    ? candidate.reasons
                    : []

        };

    }


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
                Array.isArray(
                    candidate.reasons
                )
                    ? candidate.reasons
                    : []

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
// SORT TASKS BY SMART PLACEMENT DIFFICULTY
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
                (
                    task,
                    originalIndex
                ) => {

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
                                ? Number(
                                    candidates[0].score
                                ) || 0
                                : -Infinity,

                        originalIndex

                    };

                }
            );


    analysis.sort(
        (
            a,
            b
        ) => {

            // =================================================
            // IMPOSSIBLE TASKS FIRST
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
            // BETTER BEST CANDIDATE = HIGHER PRIORITY
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


            // =================================================
            // STABLE FINAL TIE BREAKER
            // =================================================

            return (
                a.originalIndex -
                b.originalIndex
            );

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
// RELEASE RESERVED SLOT
// ============================================================
//
// Reverses reserveSlot() for ONE period.
//
// IMPORTANT:
// A double lesson occupies two periods, but its lesson-level
// counters must only be released once.
//
// Therefore this function removes the period-level occupancy
// for the supplied period while carefully avoiding double
// decrementing of lesson/session counters.
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

    const periodId =
        normalizeTimetableId(
            period.id ??
            period.periodId ??
            period.period_id
        );

    if (!periodId) {
        return false;
    }


    const streamId =
        normalizeTimetableId(
            task.streamId ??
            task.stream_id
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

    const taskId =
        normalizeTimetableId(
            task.taskId ??
            task.task_id ??
            task.id
        );

    const lessonId =
        normalizeTimetableId(
            task.lessonId ??
            task.lesson_id ??
            taskId
        );

    const roomId =
        normalizeTimetableId(
            room?.id ??
            room?.roomId ??
            room?.room_id
        );

    const dayNumber =
        Number(
            period.dayNumber ??
            period.day_number
        );


    const parallelGroup =
        getTaskParallelGroup(task);

    const parallelOccurrenceKey =
        getTaskParallelOccurrenceKey(task);

    const parallelIdentity =
        getTaskParallelIdentity(task);


    // ========================================================
    // REMOVE FROM PERIOD-LEVEL TASK INDEX
    // ========================================================

    if (
        indexes.taskPeriod instanceof Map &&
        taskId
    ) {

        const key =
            `${taskId}__${periodId}`;

        indexes.taskPeriod.delete(key);
    }


    // ========================================================
    // REMOVE FROM STREAM/PERIOD INDEX
    // ========================================================

    if (
        indexes.streamPeriod instanceof Map &&
        streamId
    ) {

        const key =
            `${streamId}__${periodId}`;

        const value =
            indexes.streamPeriod.get(key);

        if (value instanceof Set) {

            value.delete(
                taskId ||
                lessonId
            );

            if (value.size === 0) {
                indexes.streamPeriod.delete(key);
            }

        } else if (Array.isArray(value)) {

            const filtered =
                value.filter(
                    id =>
                        normalizeTimetableId(id) !==
                        (
                            taskId ||
                            lessonId
                        )
                );

            if (filtered.length > 0) {
                indexes.streamPeriod.set(
                    key,
                    filtered
                );
            } else {
                indexes.streamPeriod.delete(key);
            }

        } else {

            indexes.streamPeriod.delete(key);
        }
    }


    // ========================================================
    // REMOVE FROM DETAILED STREAM/PERIOD LESSON INDEX
    // ========================================================

    if (
        indexes.streamPeriodLessons instanceof Map &&
        streamId
    ) {

        const key =
            `${streamId}__${periodId}`;

        const lessons =
            indexes.streamPeriodLessons.get(key);

        if (lessons) {

            const removeLesson =
                lesson => {

                    if (!lesson) {
                        return false;
                    }

                    const existingTaskId =
                        normalizeTimetableId(
                            lesson.taskId ??
                            lesson.task_id
                        );

                    const existingLessonId =
                        normalizeTimetableId(
                            lesson.lessonId ??
                            lesson.lesson_id
                        );

                    if (
                        taskId &&
                        (
                            existingTaskId === taskId ||
                            existingLessonId === taskId
                        )
                    ) {
                        return true;
                    }

                    if (
                        lessonId &&
                        (
                            existingTaskId === lessonId ||
                            existingLessonId === lessonId
                        )
                    ) {
                        return true;
                    }

                    return false;
                };


            if (Array.isArray(lessons)) {

                const filtered =
                    lessons.filter(
                        lesson =>
                            !removeLesson(lesson)
                    );

                if (filtered.length > 0) {

                    indexes.streamPeriodLessons.set(
                        key,
                        filtered
                    );

                } else {

                    indexes.streamPeriodLessons.delete(key);
                }

            } else if (lessons instanceof Set) {

                const remaining =
                    new Set();

                lessons.forEach(
                    lesson => {

                        if (!removeLesson(lesson)) {
                            remaining.add(lesson);
                        }
                    }
                );

                if (remaining.size > 0) {

                    indexes.streamPeriodLessons.set(
                        key,
                        remaining
                    );

                } else {

                    indexes.streamPeriodLessons.delete(key);
                }

            } else if (
                removeLesson(lessons)
            ) {

                indexes.streamPeriodLessons.delete(key);
            }
        }
    }


    // ========================================================
    // REMOVE FROM STUDENT-GROUP/PERIOD INDEX
    // ========================================================

    const studentGroups =
        getTaskStudentGroups(task);


    if (
        indexes.studentGroupPeriodLessons instanceof Map &&
        studentGroups.length > 0
    ) {

        studentGroups.forEach(
            studentGroupId => {

                const key =
                    `${studentGroupId}__${periodId}`;

                const lessons =
                    indexes.studentGroupPeriodLessons.get(
                        key
                    );

                if (!lessons) {
                    return;
                }


                const shouldRemove =
                    lesson => {

                        if (!lesson) {
                            return false;
                        }

                        const existingTaskId =
                            normalizeTimetableId(
                                lesson.taskId ??
                                lesson.task_id
                            );

                        const existingLessonId =
                            normalizeTimetableId(
                                lesson.lessonId ??
                                lesson.lesson_id
                            );

                        return (
                            (
                                taskId &&
                                (
                                    existingTaskId === taskId ||
                                    existingLessonId === taskId
                                )
                            ) ||
                            (
                                lessonId &&
                                (
                                    existingTaskId === lessonId ||
                                    existingLessonId === lessonId
                                )
                            )
                        );
                    };


                if (Array.isArray(lessons)) {

                    const filtered =
                        lessons.filter(
                            lesson =>
                                !shouldRemove(lesson)
                        );

                    if (filtered.length > 0) {

                        indexes.studentGroupPeriodLessons.set(
                            key,
                            filtered
                        );

                    } else {

                        indexes.studentGroupPeriodLessons.delete(
                            key
                        );
                    }

                } else if (lessons instanceof Set) {

                    const remaining =
                        new Set();

                    lessons.forEach(
                        lesson => {

                            if (
                                !shouldRemove(lesson)
                            ) {
                                remaining.add(lesson);
                            }
                        }
                    );

                    if (remaining.size > 0) {

                        indexes.studentGroupPeriodLessons.set(
                            key,
                            remaining
                        );

                    } else {

                        indexes.studentGroupPeriodLessons.delete(
                            key
                        );
                    }

                }
            }
        );
    }


    // ========================================================
    // REMOVE FROM TEACHER/PERIOD INDEX
    // ========================================================

    if (
        indexes.teacherPeriod instanceof Map &&
        teacherId
    ) {

        const key =
            `${teacherId}__${periodId}`;

        const value =
            indexes.teacherPeriod.get(key);

        if (value instanceof Set) {

            value.delete(
                taskId ||
                lessonId
            );

            if (value.size === 0) {
                indexes.teacherPeriod.delete(key);
            }

        } else if (Array.isArray(value)) {

            const filtered =
                value.filter(
                    id =>
                        normalizeTimetableId(id) !==
                        (
                            taskId ||
                            lessonId
                        )
                );

            if (filtered.length > 0) {

                indexes.teacherPeriod.set(
                    key,
                    filtered
                );

            } else {

                indexes.teacherPeriod.delete(key);
            }

        } else {

            indexes.teacherPeriod.delete(key);
        }
    }


    // ========================================================
    // REMOVE FROM DETAILED TEACHER/PERIOD LESSON INDEX
    // ========================================================

    if (
        indexes.teacherPeriodLessons instanceof Map &&
        teacherId
    ) {

        const key =
            `${teacherId}__${periodId}`;

        const lessons =
            indexes.teacherPeriodLessons.get(key);

        if (lessons) {

            const shouldRemove =
                lesson => {

                    if (!lesson) {
                        return false;
                    }

                    const existingTaskId =
                        normalizeTimetableId(
                            lesson.taskId ??
                            lesson.task_id
                        );

                    const existingLessonId =
                        normalizeTimetableId(
                            lesson.lessonId ??
                            lesson.lesson_id
                        );

                    return (
                        (
                            taskId &&
                            (
                                existingTaskId === taskId ||
                                existingLessonId === taskId
                            )
                        ) ||
                        (
                            lessonId &&
                            (
                                existingTaskId === lessonId ||
                                existingLessonId === lessonId
                            )
                        )
                    );
                };


            if (Array.isArray(lessons)) {

                const filtered =
                    lessons.filter(
                        lesson =>
                            !shouldRemove(lesson)
                    );

                if (filtered.length > 0) {

                    indexes.teacherPeriodLessons.set(
                        key,
                        filtered
                    );

                } else {

                    indexes.teacherPeriodLessons.delete(key);
                }

            } else if (lessons instanceof Set) {

                const remaining =
                    new Set();

                lessons.forEach(
                    lesson => {

                        if (!shouldRemove(lesson)) {
                            remaining.add(lesson);
                        }
                    }
                );

                if (remaining.size > 0) {

                    indexes.teacherPeriodLessons.set(
                        key,
                        remaining
                    );

                } else {

                    indexes.teacherPeriodLessons.delete(key);
                }
            }
        }
    }


    // ========================================================
    // REMOVE TEACHER/SUBJECT/PERIOD INDEX
    // ========================================================

    if (
        indexes.teacherSubjectPeriod instanceof Map &&
        teacherId &&
        subjectId
    ) {

        const key =
            `${teacherId}__${subjectId}__${periodId}`;

        const value =
            indexes.teacherSubjectPeriod.get(key);

        if (value instanceof Set) {

            value.delete(
                taskId ||
                lessonId
            );

            if (value.size === 0) {
                indexes.teacherSubjectPeriod.delete(key);
            }

        } else {

            indexes.teacherSubjectPeriod.delete(key);
        }
    }


    // ========================================================
    // REMOVE ROOM/PERIOD INDEX
    // ========================================================

    if (
        indexes.roomPeriod instanceof Map &&
        roomId
    ) {

        const key =
            `${roomId}__${periodId}`;

        const value =
            indexes.roomPeriod.get(key);

        if (value instanceof Set) {

            value.delete(
                taskId ||
                lessonId
            );

            if (value.size === 0) {
                indexes.roomPeriod.delete(key);
            }

        } else if (Array.isArray(value)) {

            const filtered =
                value.filter(
                    id =>
                        normalizeTimetableId(id) !==
                        (
                            taskId ||
                            lessonId
                        )
                );

            if (filtered.length > 0) {

                indexes.roomPeriod.set(
                    key,
                    filtered
                );

            } else {

                indexes.roomPeriod.delete(key);
            }

        } else {

            indexes.roomPeriod.delete(key);
        }
    }


    // ========================================================
    // REMOVE REQUIREMENT/DAY COUNT
    // ========================================================
    //
    // IMPORTANT:
    // Do NOT blindly decrement this for every period of a
    // double lesson.
    //
    // The index represents LESSONS per day, not periods.
    //
    // ========================================================

    if (
        indexes.requirementDay instanceof Map &&
        requirementId &&
        Number.isFinite(dayNumber)
    ) {

        const key =
            `${requirementId}__${dayNumber}`;

        const current =
            Number(
                indexes.requirementDay.get(key)
            ) || 0;

        if (current > 0) {

            indexes.requirementDay.set(
                key,
                Math.max(
                    0,
                    current - 1
                )
            );
        }

        if (
            indexes.requirementDay.get(key) <= 0
        ) {
            indexes.requirementDay.delete(key);
        }
    }


    // ========================================================
    // REMOVE LESSON/DAY INDEX
    // ========================================================

    if (
        indexes.lessonDay instanceof Map &&
        lessonId &&
        Number.isFinite(dayNumber)
    ) {

        const key =
            `${lessonId}__${dayNumber}`;

        indexes.lessonDay.delete(key);
    }


    // ========================================================
    // REMOVE PARALLEL OCCURRENCE DETAIL
    // ========================================================
    //
    // If your occupancy index has a dedicated parallel map,
    // remove the task from it here.
    //
    // ========================================================

    if (
        indexes.parallelOccurrence instanceof Map &&
        parallelIdentity &&
        periodId
    ) {

        const key =
            `${parallelIdentity}__${periodId}`;

        const value =
            indexes.parallelOccurrence.get(key);

        if (value instanceof Set) {

            value.delete(
                taskId ||
                lessonId
            );

            if (value.size === 0) {
                indexes.parallelOccurrence.delete(key);
            }

        } else {

            indexes.parallelOccurrence.delete(key);
        }
    }


    // ========================================================
    // DO NOT DECREMENT WEEKLY COUNTERS HERE
    // ========================================================
    //
    // Teacher weekly/session counters are derived from the
    // period indexes in the current architecture.
    //
    // Removing the period occupancy is therefore sufficient.
    //
    // ========================================================


    return true;
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
// IMPORTANT:
//
// A double lesson occupies TWO timetable periods,
// but counts as ONE lesson occurrence for the requirement.
//
// The requirement/day counting logic should therefore remain
// inside reserveSlot() / releaseReservedSlot(), rather than
// being manually changed here.
//
// ============================================================

function placeSelectedDoubleTask(
    task,
    candidate,
    indexes
) {

    // ========================================================
    // VALIDATE INPUT
    // ========================================================

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
    //
    // The candidate was already checked during candidate
    // generation, but the timetable may have changed since
    // then.
    //
    // Therefore check again immediately before reservation.
    //
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
    // This is the final authoritative validation before
    // anything is reserved.
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
        // SECOND RESERVATION FAILED
        //
        // The first reservation succeeded, therefore it must
        // be completely rolled back.
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
                "Failed to reserve second double-lesson period; first reservation was rolled back."

        };

    }


    // ========================================================
    // CREATE FIRST ENTRY
    // ========================================================

    const firstEntry =
        createGeneratedEntry(
            task,
            firstPeriod,
            room
        );


    // ========================================================
    // CREATE SECOND ENTRY
    // ========================================================

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
    // At this point BOTH periods have already been reserved.
    //
    // If either generated entry is invalid, BOTH reservations
    // must be removed.
    //
    // IMPORTANT:
    //
    // Do NOT manually modify:
    //
    //     requirement daily counts
    //     teacher counts
    //     stream counts
    //     room occupancy
    //     student-group occupancy
    //
    // releaseReservedSlot() is responsible for reversing the
    // exact changes made by reserveSlot().
    //
    // ========================================================

    if (
        !firstEntry ||
        !secondEntry
    ) {

        // ----------------------------------------------------
        // ROLLBACK SECOND PERIOD
        // ----------------------------------------------------

        releaseReservedSlot(
            task,
            secondPeriod,
            room,
            indexes
        );


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
                "Failed to create double lesson timetable entries; both reservations were rolled back."

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
// ============================================================
// STAGE 6E — CALCULATE TASK DAY PRESSURE
// ============================================================
//
// Measures whether a task is running out of usable school
// days based on what is STILL unplaced.
//
// IMPORTANT:
//
// A double lesson:
//
//     O1 + O2
//
// occupies two timetable periods but represents ONE lesson
// occurrence for the requirement.
//
// Therefore:
//
//     remainingLessons
//
// is based on the number of requirement occurrences still
// needing placement, not the number of timetable periods.
//
// Example:
//
//     Weekly requirement = 5
//     Already placed     = 3
//     Remaining          = 2
//     Max/day            = 1
//
//     Required days = 2
//
// This is much more accurate than always calculating:
//
//     5 / 1 = 5 days
//
// after three lessons have already been placed.
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
                0,

            lessonsPerWeek:
                0,

            placedLessons:
                0,

            remainingLessons:
                0,

            maxLessonsPerDay:
                0

        };

    }


    // ========================================================
    // GET REQUIREMENT
    // ========================================================

    const requirement =
        getTaskRequirement(
            task,
            data.lookup
        );


    const lessonsPerWeek =
        Number(
            requirement?.lessonsPerWeek
        ) || 0;


    // ========================================================
    // MAXIMUM LESSONS PER DAY
    // ========================================================

    const maxLessonsPerDay =
        Number(
            task.maxLessonsPerDay ??
            requirement?.maxLessonsPerDay
        ) || 1;


    // ========================================================
    // DETERMINE ALREADY PLACED LESSON OCCURRENCES
    // ========================================================
    //
    // IMPORTANT:
    //
    // We must count LESSON OCCURRENCES, not timetable periods.
    //
    // Therefore:
    //
    //     single = 1 occurrence
    //     double = 1 occurrence
    //
    // We use requirement/day tracking where available because
    // reserveSlot() already maintains this correctly.
    //
    // ========================================================

    let placedLessons = 0;


    const requirementId =
        normalizeTimetableId(
            task.requirementId ??
            task.requirement_id ??
            requirement?.requirementId ??
            requirement?.id
        );


    // ========================================================
    // METHOD 1:
    // COUNT UNIQUE PLACED TASK OCCURRENCES
    // ========================================================
    //
    // This is the safest method when the task list contains
    // already-created tasks.
    //
    // A double task has two periods but one taskId, so it is
    // counted once.
    //
    // ========================================================

    if (
        Array.isArray(
            data.lessonTasks
        )
    ) {

        const placedTaskIds =
            new Set();


        data.lessonTasks.forEach(
            existingTask => {

                if (
                    !existingTask
                ) {

                    return;

                }


                const existingRequirementId =
                    normalizeTimetableId(
                        existingTask.requirementId ??
                        existingTask.requirement_id
                    );


                if (
                    requirementId &&
                    existingRequirementId !==
                        requirementId
                ) {

                    return;

                }


                if (
                    !existingTask.placed
                ) {

                    return;

                }


                const taskId =
                    normalizeTimetableId(
                        existingTask.taskId ??
                        existingTask.task_id ??
                        existingTask.id
                    );


                if (
                    taskId
                ) {

                    placedTaskIds.add(
                        taskId
                    );

                }

            }
        );


        placedLessons =
            placedTaskIds.size;

    }


    // ========================================================
    // METHOD 2:
    // FALLBACK TO REQUIREMENT/DAY COUNTS
    // ========================================================
    //
    // If lessonTasks is unavailable or does not contain the
    // placed tasks, use the requirement-day index.
    //
    // requirementDay is maintained by reserveSlot().
    //
    // ========================================================

    if (
        placedLessons === 0 &&
        indexesForDayPressureAvailable(
            task,
            data
        )
    ) {

        // ----------------------------------------------------
        // This helper is intentionally checked dynamically.
        //
        // It prevents this function from depending on a
        // globally named index object that may not exist in
        // every scheduler stage.
        // ----------------------------------------------------

        const indexes =
            data.indexes ||
            data.placementIndexes ||
            null;


        if (
            indexes &&
            indexes.requirementDay instanceof Map &&
            requirementId
        ) {

            let countedDays =
                0;


            indexes.requirementDay.forEach(
                (
                    count,
                    key
                ) => {

                    const normalizedKey =
                        String(
                            key
                        );


                    if (
                        normalizedKey.startsWith(
                            `${requirementId}__`
                        ) &&
                        Number(count) > 0
                    ) {

                        countedDays++;

                    }

                }
            );


            // ------------------------------------------------
            // This fallback only tells us the number of days
            // used, not the exact number of lessons.
            //
            // Therefore estimate from the daily maximum.
            // ------------------------------------------------

            if (
                countedDays > 0
            ) {

                placedLessons =
                    Math.min(
                        lessonsPerWeek,
                        countedDays *
                        maxLessonsPerDay
                    );

            }

        }

    }


    // ========================================================
    // SAFETY CLAMP
    // ========================================================

    placedLessons =
        Math.max(
            0,
            Math.min(
                lessonsPerWeek,
                placedLessons
            )
        );


    // ========================================================
    // REMAINING LESSONS
    // ========================================================

    const remainingLessons =
        Math.max(
            0,
            lessonsPerWeek -
            placedLessons
        );


    // ========================================================
    // NO REMAINING WORK
    // ========================================================

    if (
        remainingLessons === 0
    ) {

        return {

            requiredDays:
                0,

            availableDays:
                0,

            deficit:
                0,

            lessonsPerWeek,

            placedLessons,

            remainingLessons,

            maxLessonsPerDay

        };

    }


    // ========================================================
    // MINIMUM DAYS STILL REQUIRED
    // ========================================================
    //
    // Example:
    //
    // remaining = 5
    // max/day   = 1
    // required  = 5
    //
    // remaining = 5
    // max/day   = 2
    // required  = 3
    //
    // remaining = 2
    // max/day   = 2
    // required  = 1
    //
    // ========================================================

    const requiredDays =
        maxLessonsPerDay > 0
            ? Math.ceil(
                remainingLessons /
                maxLessonsPerDay
            )
            : remainingLessons;


    // ========================================================
    // AVAILABLE DAYS
    // ========================================================

    const availableDays =
        getTaskAvailableDayCount(
            task,
            candidates
        );


    // ========================================================
    // DAY DEFICIT
    // ========================================================

    const deficit =
        Math.max(
            0,
            requiredDays -
            availableDays
        );


    // ========================================================
    // RETURN
    // ========================================================

    return {

        requiredDays,

        availableDays,

        deficit,

        lessonsPerWeek,

        placedLessons,

        remainingLessons,

        maxLessonsPerDay

    };

}


// ============================================================
// DAY-PRESSURE INDEX AVAILABILITY CHECK
// ============================================================
//
// This small helper prevents getTaskDayPressure() from making
// assumptions about where the placement indexes are stored.
//
// ============================================================

function indexesForDayPressureAvailable(
    task,
    data
) {

    if (
        !task ||
        !data
    ) {

        return false;

    }


    return Boolean(
        data.indexes ||
        data.placementIndexes
    );

}

// ============================================================
// STAGE 6E — SELECT NEXT SMART TASK
// ============================================================
//
// Combines:
//
// 1. Established parallel occurrence
// 2. Day pressure
// 3. Candidate availability
// 4. Stage 6B priority
// 5. Best candidate score
// 6. Lesson duration
// 7. Room requirement
//
// IMPORTANT:
//
// Parallel synchronization is occurrence-aware.
//
// Therefore:
//
//     BIO/PHY + O1
//
// is completely different from:
//
//     BIO/PHY + O2
//
// A task is considered part of an established parallel
// placement only when BOTH:
//
//     parallelGroup
//     +
//     parallelOccurrenceKey
//
// match an already placed lesson.
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
            // TASK PRIORITY
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
        candidates,
        indexes
    );


            // ==================================================
            // PARALLEL IDENTITY
            // ==================================================
            //
            // IMPORTANT:
            //
            // Do NOT establish a parallel task merely because
            // the group exists.
            //
            // The exact occurrence must already exist.
            //
            // Example:
            //
            //     BIO/PHY + O1
            //
            // must not establish:
            //
            //     BIO/PHY + O2
            //
            // ==================================================

            const taskParallelGroup =
                getTaskParallelGroup(
                    task
                );


            const taskParallelOccurrenceKey =
                getTaskParallelOccurrenceKey(
                    task
                );


            const taskParallelIdentity =
                getTaskParallelIdentity(
                    task
                );


            let parallelOccurrenceEstablished =
                false;


            let parallelOccurrencePeriods =
                0;


            const synchronizedPeriods =
                new Set();


            // ==================================================
            // SEARCH SCHOOL-WIDE OCCUPANCY
            // ==================================================
            //
            // Use streamPeriodLessons because parallel groups
            // can span multiple streams.
            //
            // Example:
            //
            //     10E
            //     10M
            //     10L
            //     10T
            //
            // ==================================================

            if (
                taskParallelGroup &&
                taskParallelOccurrenceKey &&
                taskParallelIdentity &&
                indexes.streamPeriodLessons instanceof Map
            ) {

                indexes.streamPeriodLessons.forEach(
                    lessons => {

                        if (
                            !Array.isArray(lessons)
                        ) {

                            return;

                        }


                        lessons.forEach(
                            existingLesson => {

                                if (
                                    !existingLesson
                                ) {

                                    return;

                                }


                                const existingGroup =
                                    getTaskParallelGroup(
                                        existingLesson
                                    );


                                if (
                                    existingGroup !==
                                    taskParallelGroup
                                ) {

                                    return;

                                }


                                const existingOccurrenceKey =
                                    getTaskParallelOccurrenceKey(
                                        existingLesson
                                    );


                                if (
                                    existingOccurrenceKey !==
                                    taskParallelOccurrenceKey
                                ) {

                                    return;

                                }


                                const existingIdentity =
                                    getTaskParallelIdentity(
                                        existingLesson
                                    );


                                // --------------------------------
                                // Identity protection
                                // --------------------------------

                                if (
                                    existingIdentity &&
                                    existingIdentity !==
                                        taskParallelIdentity
                                ) {

                                    return;

                                }


                                const periodId =
                                    normalizeTimetableId(
                                        existingLesson.periodId ??
                                        existingLesson.period_id
                                    );


                                if (
                                    periodId
                                ) {

                                    synchronizedPeriods.add(
                                        periodId
                                    );

                                }

                            }
                        );

                    }
                );

            }


            parallelOccurrencePeriods =
                synchronizedPeriods.size;


            parallelOccurrenceEstablished =
                parallelOccurrencePeriods > 0;


            // ==================================================
            // STORE COMPLETE ANALYSIS
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

                parallelOccurrenceEstablished,

                parallelOccurrencePeriods

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
            // 1. ESTABLISHED PARALLEL OCCURRENCE FIRST
            // ------------------------------------------------
            //
            // If O1 has already started, finish O1 before
            // unrelated tasks consume the remaining slots.
            //
            // ------------------------------------------------

            if (
                a.parallelOccurrenceEstablished !==
                b.parallelOccurrenceEstablished
            ) {

                return a.parallelOccurrenceEstablished
                    ? -1
                    : 1;

            }


            // ------------------------------------------------
            // 2. MORE PERIODS ALREADY SYNCHRONIZED FIRST
            // ------------------------------------------------

            if (
                a.parallelOccurrencePeriods !==
                b.parallelOccurrencePeriods
            ) {

                return (
                    b.parallelOccurrencePeriods -
                    a.parallelOccurrencePeriods
                );

            }


            // ------------------------------------------------
            // 3. CRITICAL DAY DEFICIT FIRST
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
            // 4. FEWEST AVAILABLE DAYS FIRST
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
            // 5. FEWEST VALID CANDIDATES FIRST
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
            // 6. HIGHER TASK PRIORITY
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
            // 7. BETTER BEST CANDIDATE SCORE
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
            // 8. DOUBLE LESSON FIRST
            // ------------------------------------------------

            const durationA =
                Number(
                    a.task?.duration
                ) || (
                    a.task?.taskType === "double"
                        ? 2
                        : 1
                );


            const durationB =
                Number(
                    b.task?.duration
                ) || (
                    b.task?.taskType === "double"
                        ? 2
                        : 1
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
            // 9. ROOM-REQUIRED FIRST
            // ------------------------------------------------

            if (
                Boolean(
                    a.task?.requiresRoom
                ) !==
                Boolean(
                    b.task?.requiresRoom
                )
            ) {

                return a.task?.requiresRoom
                    ? -1
                    : 1;

            }


            // ------------------------------------------------
            // 10. PARALLEL GROUP
            // ------------------------------------------------

            const groupA =
                getTaskParallelGroup(
                    a.task
                );


            const groupB =
                getTaskParallelGroup(
                    b.task
                );


            const groupCompare =
                groupA.localeCompare(
                    groupB
                );


            if (
                groupCompare !== 0
            ) {

                return groupCompare;

            }


            // ------------------------------------------------
            // 11. PARALLEL OCCURRENCE
            // ------------------------------------------------

            const occurrenceA =
                getTaskParallelOccurrenceKey(
                    a.task
                );


            const occurrenceB =
                getTaskParallelOccurrenceKey(
                    b.task
                );


            const occurrenceCompare =
                occurrenceA.localeCompare(
                    occurrenceB
                );


            if (
                occurrenceCompare !== 0
            ) {

                return occurrenceCompare;

            }


            // ------------------------------------------------
            // 12. DETERMINISTIC FINAL TIE-BREAK
            // ------------------------------------------------

            return String(
                a.task?.taskId ||
                ""
            ).localeCompare(
                String(
                    b.task?.taskId ||
                    ""
                )
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
        "STAGE 6E — SMART TASK SELECTION:",
        {

            taskId:
                selected.task?.taskId,

            taskType:
                selected.task?.taskType,

            requirementId:
                selected.task?.requirementId,

            parallelGroup:
                getTaskParallelGroup(
                    selected.task
                ) ||
                null,

            parallelOccurrenceKey:
                getTaskParallelOccurrenceKey(
                    selected.task
                ) ||
                null,

            parallelIdentity:
                getTaskParallelIdentity(
                    selected.task
                ) ||
                null,

            parallelOccurrenceEstablished:
                selected.parallelOccurrenceEstablished,

            parallelOccurrencePeriods:
                selected.parallelOccurrencePeriods,

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
            selected.candidateCount,

        requiredDays:
            selected.requiredDays,

        availableDays:
            selected.availableDays,

        dayDeficit:
            selected.dayDeficit,

        parallelOccurrenceEstablished:
            selected.parallelOccurrenceEstablished,

        parallelOccurrencePeriods:
            selected.parallelOccurrencePeriods

    };

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
// ============================================================
// STAGE 6E — COUNT AVAILABLE DAYS FOR TASK
// ============================================================
//
// Counts DISTINCT school days represented by currently valid
// candidates.
//
// For singles:
//     candidate.period
//
// For doubles:
//     candidate.firstPeriod
//
// A double occupies two consecutive periods but still belongs
// to ONE school day.
//
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


            // ==================================================
            // SINGLE CANDIDATE
            // ==================================================

            let period =
                candidate.period ||
                null;


            // ==================================================
            // DOUBLE CANDIDATE
            // ==================================================

            if (
                !period
            ) {

                period =
                    candidate.firstPeriod ||
                    null;

            }


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
// The calculation is based on the REMAINING lessons, not the
// original weekly total.
//
// Example:
//
//     lessonsPerWeek = 5
//     maxLessonsPerDay = 1
//
//     placed = 2
//
//     remaining = 3
//     requiredDays = 3
//
// ============================================================

function getTaskDayPressure(
    task,
    data,
    candidates,
    indexes
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
                0,

            lessonsPerWeek:
                0,

            placedLessons:
                0,

            remainingLessons:
                0,

            maxLessonsPerDay:
                0

        };

    }


    // ========================================================
    // REQUIREMENT
    // ========================================================

    const requirement =
        getTaskRequirement(
            task,
            data.lookup
        );


    const lessonsPerWeek =
        Number(
            task.lessonsPerWeek ??
            requirement?.lessonsPerWeek
        ) || 0;


    const maxLessonsPerDay =
        Number(
            task.maxLessonsPerDay ??
            requirement?.maxLessonsPerDay
        ) || 1;


    const requirementId =
        normalizeTimetableId(
            task.requirementId ??
            task.requirement_id ??
            requirement?.requirementId ??
            requirement?.id
        );


    // ========================================================
    // COUNT PLACED LESSONS
    // ========================================================
    //
    // Prefer actual placed task objects.
    //
    // A double lesson is ONE lesson task even though it occupies
    // TWO periods.
    //
    // ========================================================

    let placedLessons =
        0;


    const placedTaskIds =
        new Set();


    if (
        Array.isArray(
            data.lessonTasks
        )
    ) {

        data.lessonTasks.forEach(
            existingTask => {

                if (
                    !existingTask ||
                    !existingTask.placed
                ) {

                    return;

                }


                const existingRequirementId =
                    normalizeTimetableId(
                        existingTask.requirementId ??
                        existingTask.requirement_id
                    );


                if (
                    requirementId &&
                    existingRequirementId !==
                        requirementId
                ) {

                    return;

                }


                const existingTaskId =
                    normalizeTimetableId(
                        existingTask.taskId ??
                        existingTask.task_id ??
                        existingTask.id
                    );


                if (
                    existingTaskId
                ) {

                    placedTaskIds.add(
                        existingTaskId
                    );

                }

            }
        );


        placedLessons =
            placedTaskIds.size;

    }


    // ========================================================
    // FALLBACK TO REQUIREMENT-DAY INDEX
    // ========================================================
    //
    // This is only used when no placed task objects were found.
    //
    // requirementDay stores lesson counts per requirement/day.
    //
    // ========================================================

    if (
        placedLessons === 0 &&
        indexes &&
        indexes.requirementDay instanceof Map &&
        requirementId
    ) {

        let usedDays =
            0;


        let indexedLessons =
            0;


        indexes.requirementDay.forEach(
            (
                count,
                key
            ) => {

                const normalizedKey =
                    String(
                        key
                    );


                if (
                    !normalizedKey.startsWith(
                        `${requirementId}__`
                    )
                ) {

                    return;

                }


                const numericCount =
                    Number(
                        count
                    ) || 0;


                if (
                    numericCount > 0
                ) {

                    usedDays++;


                    indexedLessons +=
                        numericCount;

                }

            }
        );


        if (
            indexedLessons > 0
        ) {

            placedLessons =
                Math.min(
                    lessonsPerWeek,
                    indexedLessons
                );

        }
        else if (
            usedDays > 0
        ) {

            placedLessons =
                Math.min(
                    lessonsPerWeek,
                    usedDays *
                    maxLessonsPerDay
                );

        }

    }


    // ========================================================
    // CLAMP PLACED LESSONS
    // ========================================================

    placedLessons =
        Math.max(
            0,
            Math.min(
                lessonsPerWeek,
                placedLessons
            )
        );


    // ========================================================
    // REMAINING LESSONS
    // ========================================================

    const remainingLessons =
        Math.max(
            0,
            lessonsPerWeek -
            placedLessons
        );


    // ========================================================
    // NOTHING REMAINING
    // ========================================================

    if (
        remainingLessons === 0
    ) {

        return {

            requiredDays:
                0,

            availableDays:
                0,

            deficit:
                0,

            lessonsPerWeek,

            placedLessons,

            remainingLessons,

            maxLessonsPerDay

        };

    }


    // ========================================================
    // REQUIRED REMAINING DAYS
    // ========================================================

    const requiredDays =
        maxLessonsPerDay > 0
            ? Math.ceil(
                remainingLessons /
                maxLessonsPerDay
            )
            : remainingLessons;


    // ========================================================
    // CURRENTLY AVAILABLE DAYS
    // ========================================================

    const availableDays =
        getTaskAvailableDayCount(
            task,
            candidates
        );


    // ========================================================
    // DAY DEFICIT
    // ========================================================

    const deficit =
        Math.max(
            0,
            requiredDays -
            availableDays
        );


    return {

        requiredDays,

        availableDays,

        deficit,

        lessonsPerWeek,

        placedLessons,

        remainingLessons,

        maxLessonsPerDay

    };

}
// ============================================================
// STAGE 6E — SELECT NEXT SMART TASK
// ============================================================
//
// Combines:
//
// 1. Established parallel occurrence
// 2. Number of synchronized periods
// 3. Day pressure
// 4. Candidate availability
// 5. Stage 6B priority
// 6. Best candidate score
// 7. Task duration
// 8. Room requirement
//
// IMPORTANT:
//
// Parallel synchronization is occurrence-aware.
//
// Therefore:
//
//     BIO + O1
//
// does NOT establish:
//
//     BIO + O2
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


    const taskCandidates =
        [];


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
                [];


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


            const candidateCount =
                candidates.length;


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
                    candidates,
                    indexes
                );


            // ==================================================
            // PARALLEL IDENTITY
            // ==================================================
            //
            // A parallel group by itself is NOT sufficient.
            //
            // We must identify the exact occurrence:
            //
            //     group + occurrence key
            //
            // Example:
            //
            //     BIO/PHY__O1
            //     BIO/PHY__O2
            //
            // ==================================================

            const taskParallelGroup =
                getTaskParallelGroup(
                    task
                );


            const taskParallelOccurrenceKey =
                getTaskParallelOccurrenceKey(
                    task
                );


            const taskParallelIdentity =
                getTaskParallelIdentity(
                    task
                );


            let parallelGroupEstablished =
                false;


            let parallelGroupPeriods =
                0;


            // ==================================================
            // CHECK EXISTING SCHOOL-WIDE OCCUPANCY
            // ==================================================
            //
            // Use streamPeriodLessons when available because
            // parallel lessons can span multiple streams.
            //
            // Fall back to studentGroupPeriodLessons for
            // compatibility with older indexes.
            //
            // ==================================================

            const synchronizedPeriods =
                new Set();


            if (
                taskParallelGroup &&
                taskParallelOccurrenceKey
            ) {

                // ------------------------------------------------
                // PRIMARY INDEX
                // ------------------------------------------------

                if (
                    indexes.streamPeriodLessons instanceof Map
                ) {

                    indexes.streamPeriodLessons.forEach(
                        (
                            lessons,
                            key
                        ) => {

                            if (
                                !Array.isArray(
                                    lessons
                                ) ||
                                lessons.length === 0
                            ) {

                                return;

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

                                return;

                            }


                            const periodId =
                                String(
                                    key
                                ).slice(
                                    separatorIndex + 2
                                );


                            const matchingLesson =
                                lessons.some(
                                    existingLesson => {

                                        if (
                                            !existingLesson
                                        ) {

                                            return false;

                                        }


                                        const existingGroup =
                                            getTaskParallelGroup(
                                                existingLesson
                                            );


                                        const existingOccurrenceKey =
                                            getTaskParallelOccurrenceKey(
                                                existingLesson
                                            );


                                        if (
                                            existingGroup !==
                                                taskParallelGroup
                                        ) {

                                            return false;

                                        }


                                        if (
                                            existingOccurrenceKey !==
                                                taskParallelOccurrenceKey
                                        ) {

                                            return false;

                                        }


                                        const existingIdentity =
                                            getTaskParallelIdentity(
                                                existingLesson
                                            );


                                        // --------------------------------
                                        // If both identities exist they
                                        // MUST match exactly.
                                        // --------------------------------

                                        if (
                                            taskParallelIdentity &&
                                            existingIdentity &&
                                            taskParallelIdentity !==
                                                existingIdentity
                                        ) {

                                            return false;

                                        }


                                        return true;

                                    }
                                );


                            if (
                                matchingLesson
                            ) {

                                synchronizedPeriods.add(
                                    periodId
                                );

                            }

                        }
                    );

                }


                // ------------------------------------------------
                // FALLBACK INDEX
                // ------------------------------------------------
                //
                // Used when streamPeriodLessons has not yet been
                // populated by an older generation path.
                //
                // ------------------------------------------------

                if (
                    synchronizedPeriods.size === 0 &&
                    indexes.studentGroupPeriodLessons instanceof Map
                ) {

                    const studentGroups =
                        getTaskStudentGroups(
                            task
                        );


                    studentGroups.forEach(
                        studentGroupId => {

                            if (
                                !studentGroupId
                            ) {

                                return;

                            }


                            indexes.studentGroupPeriodLessons.forEach(
                                (
                                    lessons,
                                    key
                                ) => {

                                    if (
                                        !Array.isArray(
                                            lessons
                                        ) ||
                                        lessons.length === 0
                                    ) {

                                        return;

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

                                        return;

                                    }


                                    const keyGroupId =
                                        String(
                                            key
                                        ).slice(
                                            0,
                                            separatorIndex
                                        );


                                    const periodId =
                                        String(
                                            key
                                        ).slice(
                                            separatorIndex + 2
                                        );


                                    if (
                                        String(
                                            keyGroupId
                                        ) !==
                                        String(
                                            studentGroupId
                                        )
                                    ) {

                                        return;

                                    }


                                    const matchingLesson =
                                        lessons.some(
                                            existingLesson => {

                                                if (
                                                    !existingLesson
                                                ) {

                                                    return false;

                                                }


                                                const existingGroup =
                                                    getTaskParallelGroup(
                                                        existingLesson
                                                    );


                                                const existingOccurrenceKey =
                                                    getTaskParallelOccurrenceKey(
                                                        existingLesson
                                                    );


                                                if (
                                                    existingGroup !==
                                                        taskParallelGroup
                                                ) {

                                                    return false;

                                                }


                                                if (
                                                    existingOccurrenceKey !==
                                                        taskParallelOccurrenceKey
                                                ) {

                                                    return false;

                                                }


                                                const existingIdentity =
                                                    getTaskParallelIdentity(
                                                        existingLesson
                                                    );


                                                if (
                                                    taskParallelIdentity &&
                                                    existingIdentity &&
                                                    taskParallelIdentity !==
                                                        existingIdentity
                                                ) {

                                                    return false;

                                                }


                                                return true;

                                            }
                                        );


                                    if (
                                        matchingLesson
                                    ) {

                                        synchronizedPeriods.add(
                                            periodId
                                        );

                                    }

                                }
                            );

                        }
                    );

                }

            }


            // ==================================================
            // ESTABLISHED PARALLEL OCCURRENCE
            // ==================================================

            if (
                synchronizedPeriods.size > 0
            ) {

                parallelGroupEstablished =
                    true;


                parallelGroupPeriods =
                    synchronizedPeriods.size;

            }


            // ==================================================
            // STORE COMPLETE ANALYSIS
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

                parallelGroup:
                    taskParallelGroup,

                parallelOccurrenceKey:
                    taskParallelOccurrenceKey,

                parallelIdentity:
                    taskParallelIdentity

            });

        }
    );


    // ========================================================
    // NO TASKS
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
            // 1. ESTABLISHED PARALLEL OCCURRENCE
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
            // 2. MORE SYNCHRONIZED PERIODS
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
            // 3. DAY DEFICIT
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
            // 4. FEWEST AVAILABLE DAYS
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
            // 5. FEWEST CANDIDATES
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
            // 6. HIGHER PRIORITY
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
            // 7. BETTER CANDIDATE SCORE
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
            // 8. DOUBLE LESSON FIRST
            // ------------------------------------------------

            const durationA =
                Number(
                    a.task.duration
                ) || (
                    a.task.taskType === "double"
                        ? 2
                        : 1
                );


            const durationB =
                Number(
                    b.task.duration
                ) || (
                    b.task.taskType === "double"
                        ? 2
                        : 1
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
            // 9. ROOM REQUIRED FIRST
            // ------------------------------------------------

            if (
                Boolean(
                    a.task.requiresRoom
                ) !==
                Boolean(
                    b.task.requiresRoom
                )
            ) {

                return a.task.requiresRoom
                    ? -1
                    : 1;

            }


            // ------------------------------------------------
            // 10. PARALLEL GROUP
            // ------------------------------------------------

            const groupCompare =
                String(
                    a.parallelGroup ||
                    ""
                ).localeCompare(
                    String(
                        b.parallelGroup ||
                        ""
                    )
                );


            if (
                groupCompare !== 0
            ) {

                return groupCompare;

            }


            // ------------------------------------------------
            // 11. PARALLEL OCCURRENCE
            // ------------------------------------------------

            const occurrenceCompare =
                String(
                    a.parallelOccurrenceKey ||
                    ""
                ).localeCompare(
                    String(
                        b.parallelOccurrenceKey ||
                        ""
                    )
                );


            if (
                occurrenceCompare !== 0
            ) {

                return occurrenceCompare;

            }


            // ------------------------------------------------
            // 12. FINAL DETERMINISTIC TIE-BREAK
            // ------------------------------------------------

            return String(
                a.task.taskId ||
                a.task.task_id ||
                a.task.id ||
                ""
            ).localeCompare(
                String(
                    b.task.taskId ||
                    b.task.task_id ||
                    b.task.id ||
                    ""
                )
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
        "STAGE 6E — SMART TASK SELECTION:",
        {

            taskId:
                selected.task?.taskId ??
                selected.task?.task_id ??
                selected.task?.id ??
                null,

            taskType:
                selected.task?.taskType ??
                null,

            requirementId:
                selected.task?.requirementId ??
                selected.task?.requirement_id ??
                null,

            parallelGroup:
                selected.parallelGroup ||
                null,

            parallelOccurrenceKey:
                selected.parallelOccurrenceKey ||
                null,

            parallelIdentity:
                selected.parallelIdentity ||
                null,

            parallelGroupEstablished:
                selected.parallelGroupEstablished,

            parallelGroupPeriods:
                selected.parallelGroupPeriods,

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
            selected.candidateCount,

        requiredDays:
            selected.requiredDays,

        availableDays:
            selected.availableDays,

        dayDeficit:
            selected.dayDeficit,

        parallelGroup:
            selected.parallelGroup,

        parallelOccurrenceKey:
            selected.parallelOccurrenceKey,

        parallelIdentity:
            selected.parallelIdentity,

        parallelGroupEstablished:
            selected.parallelGroupEstablished,

        parallelGroupPeriods:
            selected.parallelGroupPeriods

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
    //
    // This is a working queue.
    //
    // The original data.lessonTasks array is NOT reordered.
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
    // MAIN SMART PLACEMENT LOOP
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
        // NO SELECTION
        // ====================================================
        //
        // This normally means there are no remaining tasks
        // that can currently produce a valid selection.
        //
        // Record the remaining tasks as failed rather than
        // silently leaving them unresolved.
        //
        // ====================================================

        if (
            !selection
        ) {

            console.warn(
                "STAGE 6F — NO TASK SELECTION AVAILABLE."
            );


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
                            "No valid task selection could be produced."

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


            break;

        }


        const task =
            selection.task;


        if (
            !task
        ) {

            console.warn(
                "STAGE 6F — Selection returned without a task."
            );

            break;

        }


        // ====================================================
        // NO CANDIDATES
        // ====================================================

        if (
            !Array.isArray(
                selection.candidates
            ) ||
            selection.candidates.length === 0
        ) {

            const reason =
                "No valid placement candidate exists.";


            console.warn(
                "SMART PLACEMENT — NO CANDIDATE:",
                {

                    taskId:
                        task.taskId ??
                        task.task_id ??
                        task.id ??
                        null,

                    taskType:
                        task.taskType ??
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
                        getTaskParallelGroup(
                            task
                        ) || null,

                    parallelOccurrenceKey:
                        getTaskParallelOccurrenceKey(
                            task
                        ) || null,

                    reason

                }
            );


            result.failedTasks.push({

                task,

                reason

            });


            task.placed =
                false;


            task.periodIds =
                [];


            task.roomId =
                null;


            // ------------------------------------------------
            // REMOVE FROM ACTIVE QUEUE
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
        // Candidate #1 is preferred, but failure of one
        // candidate does NOT mean the task has failed.
        //
        // Every candidate is attempted until one succeeds.
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
                        task.id ??
                        null,

                    taskType:
                        task.taskType ??
                        null,

                    requirementId:
                        task.requirementId ??
                        task.requirement_id ??
                        null,

                    parallelGroup:
                        getTaskParallelGroup(
                            task
                        ) || null,

                    parallelOccurrenceKey:
                        getTaskParallelOccurrenceKey(
                            task
                        ) || null,

                    candidateScore:
                        candidate.score ??
                        null,

                    candidateDay:
                        candidate.period?.dayNumber ??
                        candidate.firstPeriod?.dayNumber ??
                        null,

                    candidatePeriod:
                        candidate.period?.periodOrder ??
                        candidate.firstPeriod?.periodOrder ??
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
            // TASK DURATION
            // =================================================
            //
            // Double = 2 periods
            // Single = 1 period
            //
            // Do not depend entirely on task.duration because
            // older task objects may not contain it.
            //
            // =================================================

            const taskDuration =
                Number(
                    task.duration
                ) ||
                (
                    task.taskType === "double"
                        ? 2
                        : 1
                );


            result.statistics.totalPeriodsPlaced +=
                taskDuration;


            // ------------------------------------------------
            // REMOVE PLACED TASK FROM ACTIVE QUEUE
            // ------------------------------------------------

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


            // ------------------------------------------------
            // SUCCESS LOG
            // ------------------------------------------------

            console.log(
                "SMART PLACEMENT SUCCESS:",
                {

                    taskId:
                        task.taskId ??
                        task.task_id ??
                        task.id ??
                        null,

                    type:
                        task.taskType ??
                        null,

                    requirementId:
                        task.requirementId ??
                        task.requirement_id ??
                        null,

                    parallelGroup:
                        getTaskParallelGroup(
                            task
                        ) || null,

                    parallelOccurrenceKey:
                        getTaskParallelOccurrenceKey(
                            task
                        ) || null,

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
                    task.taskId ??
                    task.task_id ??
                    task.id ??
                    null,

                taskType:
                    task.taskType ??
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
                    getTaskParallelGroup(
                        task
                    ) || null,

                parallelOccurrenceKey:
                    getTaskParallelOccurrenceKey(
                        task
                    ) || null,

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
        // REMOVE FAILED TASK FROM ACTIVE QUEUE
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

        console.warn(
            "STAGE 6F — SAFETY ITERATION LIMIT REACHED:",
            {

                maximumIterations,

                remainingTasks:
                    remainingTasks.length

            }
        );


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


    // ========================================================
    // LOG GENERATION RESULT
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
                item => {

                    const task =
                        item?.task ||
                        null;


                    return {

                        taskId:
                            task?.taskId ??
                            task?.task_id ??
                            task?.id ??
                            null,

                        type:
                            task?.taskType ??
                            null,

                        streamId:
                            task?.streamId ??
                            task?.stream_id ??
                            null,

                        subjectId:
                            task?.subjectId ??
                            task?.subject_id ??
                            null,

                        teacherId:
                            task?.teacherId ??
                            task?.teacher_id ??
                            null,

                        requirementId:
                            task?.requirementId ??
                            task?.requirement_id ??
                            null,

                        parallelGroup:
                            getTaskParallelGroup(
                                task
                            ) || null,

                        parallelOccurrenceKey:
                            getTaskParallelOccurrenceKey(
                                task
                            ) || null,

                        reason:
                            item?.reason ||
                            "Unknown"

                    };

                }
            )
        );

    }


    // ========================================================
    // FAILURE REASON SUMMARY
    // ========================================================

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


    // ========================================================
    // FAILED REQUIREMENT DIAGNOSTIC
    // ========================================================
    //
    // Groups all failed tasks by requirement.
    //
    // ========================================================

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
                    normalizeTimetableId(
                        task.requirementId ??
                        task.requirement_id ??
                        ""
                    );


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
                            getTaskParallelGroup(
                                task
                            ) || null,

                        parallelOccurrenceKey:
                            getTaskParallelOccurrenceKey(
                                task
                            ) || null,

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

                    parallelOccurrences:
                        tasks
                            .map(
                                task =>
                                    task.parallelOccurrenceKey ||
                                    ""
                            )
                            .filter(
                                value =>
                                    value
                            )
                            .join(
                                ", "
                            )

                })
            )
        );


        console.log(
            "======================================"
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
                item => {

                    const task =
                        item?.task ||
                        null;


                    return {

                        taskId:
                            task?.taskId ??
                            task?.task_id ??
                            task?.id ??
                            null,

                        type:
                            task?.taskType ??
                            null,

                        requirementId:
                            task?.requirementId ??
                            task?.requirement_id ??
                            null,

                        parallelGroup:
                            getTaskParallelGroup(
                                task
                            ) || null,

                        parallelOccurrenceKey:
                            getTaskParallelOccurrenceKey(
                                task
                            ) || null,

                        periods:
                            Array.isArray(
                                task?.periodIds
                            )
                                ? task.periodIds.join(
                                    ", "
                                )
                                : "",

                        room:
                            task?.roomId ??
                            null,

                        score:
                            item?.candidate?.score ??
                            null

                    };

                }
            )
        );

    }


    // ========================================================
    // FINAL PLACEMENT COUNTS BY REQUIREMENT
    // ========================================================
    //
    // This gives us an immediate indication of requirements
    // that may still be short before the audit phase.
    //
    // ========================================================

    const requirementPlacementCounts =
        new Map();


    result.placedTasks.forEach(
        item => {

            const task =
                item?.task;


            if (
                !task
            ) {

                return;

            }


            const requirementId =
                normalizeTimetableId(
                    task.requirementId ??
                    task.requirement_id ??
                    ""
                );


            if (
                !requirementId
            ) {

                return;

            }


            requirementPlacementCounts.set(
                requirementId,
                (
                    requirementPlacementCounts.get(
                        requirementId
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
        "STAGE 6F — REQUIREMENT PLACEMENT COUNTS"
    );

    console.log(
        "======================================"
    );


    console.table(
        [
            ...requirementPlacementCounts.entries()
        ]
        .map(
            (
                [
                    requirementId,
                    placed
                ]
            ) => {

                const requirement =
                    Array.isArray(
                        data.requirements
                    )
                        ? data.requirements.find(
                            item =>
                                normalizeTimetableId(
                                    item?.requirementId ??
                                    item?.requirement_id ??
                                    item?.id ??
                                    ""
                                ) ===
                                requirementId
                        )
                        : null;


                const expected =
                    Number(
                        requirement?.lessonsPerWeek
                    ) || 0;


                return {

                    requirementId,

                    expected,

                    placed,

                    deficit:
                        Math.max(
                            0,
                            expected -
                            placed
                        )

                };

            }
        )
        .filter(
            row =>
                row.deficit > 0
        )
    );


    // ========================================================
    // RETURN COMPLETE RESULT
    // ========================================================

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

        // ====================================================
        // STATUS
        // ====================================================

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


        if (
            !Array.isArray(
                generatorData.lessonTasks
            )
        ) {

            throw new Error(
                "Generator data contains no lesson tasks."
            );

        }


        // ====================================================
        // STAGE 2 — PREPARE SMART TASK ORDER
        // ====================================================
        //
        // This prepares the deterministic base ordering.
        //
        // Stage 6E still makes the final dynamic decision
        // using current candidates, day pressure and parallel
        // occurrence state.
        //
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
        //
        // Stage 7 must continue using the SAME occupancy state
        // created by Stage 6F.
        //
        // Do not recreate indexes here.
        //
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


        // ====================================================
        // EXTRACT FAILED TASK OBJECTS
        // ====================================================

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
        // EXTRACT ACTUAL PLACED TASK OBJECTS
        // ====================================================
        //
        // result.placedTasks contains:
        //
        // {
        //     task,
        //     entries,
        //     candidate
        // }
        //
        // Stage 7 needs the actual task objects.
        //
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


        // ====================================================
        // RUN STAGE 7
        // ====================================================

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
        // If Stage 7 moves:
        //
        //     Task A: P3 -> P7
        //
        // the old P3 entry must be removed from result.entries
        // before the new P7 entry is merged.
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


                            if (
                                !entryTaskId ||
                                !entryPeriodId
                            ) {

                                return true;

                            }


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
        // MERGE STAGE 7 ENTRIES
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
        // REMOVE EXACT DUPLICATE TASK/PERIOD ENTRIES
        // ====================================================
        //
        // This does NOT resolve stream-period conflicts between
        // different tasks. Those must still be caught by the
        // final audit.
        //
        // It only prevents the same task from appearing twice
        // in exactly the same period.
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
                // Preserve entries without a task ID.
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
                    Number(
                        repairResult?.repairedCount
                    ) || 0
                );


            // ------------------------------------------------
            // Final entry count is authoritative for occupied
            // teaching periods.
            //
            // A single = 1 entry
            // A double = 2 entries
            //
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
            Number(
                repairResult?.repairedCount
            ) || 0
        );

        console.log(
            "Still failed tasks:",
            result.failedTasks.length
        );

        console.log(
            "Repair entries:",
            Array.isArray(
                repairResult?.entries
            )
                ? repairResult.entries.length
                : 0
        );

        console.log(
            "Moved lessons:",
            Array.isArray(
                repairResult?.moved
            )
                ? repairResult.moved.length
                : 0
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


        // ====================================================
        // AUDIT PASSED
        // ====================================================

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
        //
        // Keep the rich generated entry objects in memory.
        //
        // Only convert to database columns here.
        //
        // This means audit/debugging can still use:
        //
        //     parallel_group
        //     parallel_occurrence_key
        //     parallel_occurrence
        //     parallel_identity
        //     student_group_ids
        //
        // even if those fields are not database columns.
        //
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
        // FAILED TASK WARNING
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


        // ====================================================
        // RETURN COMPLETE RESULT
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


// ============================================================
// NORMALIZE GENERATED ENTRY
// ============================================================
//
// Accepts BOTH:
//
//     camelCase
//     snake_case
//
// IMPORTANT:
//
// Parallel lessons require BOTH:
//
//     parallelGroup
//     parallelOccurrenceKey
//
// The occurrence identity is therefore preserved here so
// Stage 6G uses exactly the same parallel identity as the
// placement engine.
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


    const parallelGroup =
        normalizeTimetableId(
            entry.parallelGroup ??
            entry.parallel_group
        );


    const parallelOccurrenceKey =
        normalizeTimetableId(
            entry.parallelOccurrenceKey ??
            entry.parallel_occurrence_key
        );


    const rawParallelOccurrence =
        entry.parallelOccurrence ??
        entry.parallel_occurrence;


    const numericParallelOccurrence =
        Number(
            rawParallelOccurrence
        );


    const parallelOccurrence =
        Number.isFinite(
            numericParallelOccurrence
        )
            ? numericParallelOccurrence
            : null;


    const parallelOccurrenceIndexes =
        Array.isArray(
            entry.parallelOccurrenceIndexes
        )
            ? [
                ...entry.parallelOccurrenceIndexes
            ]
            : (
                Array.isArray(
                    entry.parallel_occurrence_indexes
                )
                    ? [
                        ...entry.parallel_occurrence_indexes
                    ]
                    : []
            );


    const suppliedParallelIdentity =
        normalizeTimetableId(
            entry.parallelIdentity ??
            entry.parallel_identity
        );


    const parallelIdentity =
        (
            parallelGroup &&
            parallelOccurrenceKey
        )
            ? `${parallelGroup}__${parallelOccurrenceKey}`
            : (
                suppliedParallelIdentity ||
                ""
            );


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
            parallelGroup,

        parallelOccurrenceKey:
            parallelOccurrenceKey,

        parallelOccurrence:
            parallelOccurrence,

        parallelOccurrenceIndexes:
            parallelOccurrenceIndexes,

        parallelIdentity:
            parallelIdentity

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
//
// A stream normally may have only ONE lesson in a period.
//
// The ONLY exception is an explicitly configured parallel
// lesson.
//
// Parallel teaching is valid only when:
//
//     1. Subjects are different
//     2. Teachers are different
//     3. Both entries have an explicit parallel group
//     4. The parallel groups are identical
//     5. Both entries have an explicit occurrence key
//     6. The occurrence keys are identical
//     7. The complete parallel identity is identical
//
// Therefore:
//
//     GROUP-1 + O1
//     GROUP-1 + O1
//
// can be parallel.
//
// But:
//
//     GROUP-1 + O1
//     GROUP-1 + O2
//
// is a REAL stream conflict.
//
// This matches the placement engine and prevents the audit from
// accepting different parallel occurrences in the same period.
//
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
            // EXISTING LESSONS
            // ====================================================

            const existingLessons =
                occupied.get(
                    key
                );


            // ====================================================
            // CHECK EACH EXISTING LESSON
            // ====================================================

            let parallelAllowed =
                true;


            for (
                const existingLesson
                of existingLessons
            ) {

                const existing =
                    existingLesson.normalized;


                // ------------------------------------------------
                // SAME SUBJECT
                // ------------------------------------------------
                //
                // Same subject in the same stream and period is
                // not parallel teaching.
                //
                // ------------------------------------------------

                const sameSubject =
                    Boolean(
                        normalized.subjectId &&
                        existing.subjectId &&
                        normalized.subjectId ===
                        existing.subjectId
                    );


                // ------------------------------------------------
                // SAME TEACHER
                // ------------------------------------------------

                const sameTeacher =
                    Boolean(
                        normalized.teacherId &&
                        existing.teacherId &&
                        normalized.teacherId ===
                        existing.teacherId
                    );


                // ------------------------------------------------
                // PARALLEL GROUP
                // ------------------------------------------------

                const sameParallelGroup =
                    Boolean(
                        normalized.parallelGroup &&
                        existing.parallelGroup &&
                        normalized.parallelGroup ===
                        existing.parallelGroup
                    );


                // ------------------------------------------------
                // PARALLEL OCCURRENCE KEY
                // ------------------------------------------------
                //
                // This is the critical correction.
                //
                // Same parallel group alone is NOT enough.
                //
                // Example:
                //
                //     BIO / GROUP-A / O1
                //     PHY / GROUP-A / O2
                //
                // These must NOT be accepted as parallel.
                //
                // ------------------------------------------------

                const sameParallelOccurrenceKey =
                    Boolean(
                        normalized.parallelOccurrenceKey &&
                        existing.parallelOccurrenceKey &&
                        normalized.parallelOccurrenceKey ===
                        existing.parallelOccurrenceKey
                    );


                // ------------------------------------------------
                // COMPLETE PARALLEL IDENTITY
                // ------------------------------------------------

                const sameParallelIdentity =
                    Boolean(
                        normalized.parallelIdentity &&
                        existing.parallelIdentity &&
                        normalized.parallelIdentity ===
                        existing.parallelIdentity
                    );


                // ------------------------------------------------
                // VALID EXPLICIT PARALLEL LESSON
                // ------------------------------------------------
                //
                // Every condition must be satisfied.
                //
                // ------------------------------------------------

                const validExplicitParallel =
                    !sameSubject &&
                    !sameTeacher &&
                    sameParallelGroup &&
                    sameParallelOccurrenceKey &&
                    sameParallelIdentity;


                if (
                    !validExplicitParallel
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
            // Keep the lesson in occupancy so that additional
            // conflicts involving this lesson are also found.
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
        teacher.maxConsecutiveLessons ??
        teacher.max_consecutive_lessons
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
// A double lesson must occupy exactly TWO consecutive teaching
// periods for the same task.
//
// The final generated entries are authoritative because Stage 7
// may move or repair lessons after the original Stage 6F
// placement wrappers were created.
//
// Requirements:
//
//     1. exactly two entries for the double task
//     2. same requirement
//     3. same stream
//     4. same subject
//     5. same teacher
//     6. same room
//     7. same parallel group
//     8. same parallel occurrence key
//     9. same parallel identity
//    10. same day
//    11. consecutive teaching periods
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
    // BUILD NORMALIZED FINAL ENTRY LIST
    // ========================================================

    const normalizedEntries =
        [];


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
                normalized
            ) {

                normalizedEntries.push({

                    index,

                    entry,

                    normalized

                });

            }

        }
    );


    // ========================================================
    // BUILD FINAL ENTRIES BY TASK
    // ========================================================
    //
    // This is the authoritative source for Stage 6G.
    //
    // ========================================================

    const entriesByTask =
        new Map();


    normalizedEntries.forEach(
        item => {

            const taskId =
                item.normalized.taskId;


            if (
                !taskId
            ) {

                return;

            }


            if (
                !entriesByTask.has(
                    taskId
                )
            ) {

                entriesByTask.set(
                    taskId,
                    []
                );

            }


            entriesByTask
                .get(taskId)
                .push(
                    item
                );

        }
    );


    // ========================================================
    // IDENTIFY ALL DOUBLE TASKS
    // ========================================================
    //
    // Prefer generatorData.lessonTasks because it contains the
    // authoritative taskType.
    //
    // Also inspect placedTasks as a fallback so repaired tasks
    // are not missed.
    //
    // ========================================================

    const doubleTasks =
        new Map();


    if (
        Array.isArray(
            data?.lessonTasks
        )
    ) {

        data.lessonTasks.forEach(
            task => {

                if (
                    !task
                ) {

                    return;

                }


                if (
                    task.taskType !== "double" &&
                    task.isDouble !== true
                ) {

                    return;

                }


                const taskId =
                    normalizeTimetableId(
                        task.taskId ??
                        task.task_id ??
                        task.id
                    );


                if (
                    taskId
                ) {

                    doubleTasks.set(
                        taskId,
                        task
                    );

                }

            }
        );

    }


    // ========================================================
    // FALLBACK / ADDITIONAL DOUBLE TASKS FROM PLACEMENTS
    // ========================================================

    placedTasks.forEach(
        placement => {

            const task =
                placement?.task ||
                placement;


            if (
                !task
            ) {

                return;

            }


            if (
                task.taskType !== "double" &&
                task.isDouble !== true
            ) {

                return;

            }


            const taskId =
                normalizeTimetableId(
                    task.taskId ??
                    task.task_id ??
                    task.id
                );


            if (
                taskId &&
                !doubleTasks.has(
                    taskId
                )
            ) {

                doubleTasks.set(
                    taskId,
                    task
                );

            }

        }
    );


    // ========================================================
    // AUDIT EVERY DOUBLE TASK
    // ========================================================

    doubleTasks.forEach(
        (
            task,
            taskId
        ) => {

            const taskEntries =
                entriesByTask.get(
                    taskId
                ) || [];


            // ------------------------------------------------
            // MUST HAVE EXACTLY TWO FINAL ENTRIES
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
                            taskEntries.length,

                        entryIndexes:
                            taskEntries.map(
                                item =>
                                    item.index
                            )

                    }
                );


                return;

            }


            const firstItem =
                taskEntries[0];


            const secondItem =
                taskEntries[1];


            const first =
                firstItem.normalized;


            const second =
                secondItem.normalized;


            // ------------------------------------------------
            // TASK ID
            // ------------------------------------------------

            if (
                first.taskId !==
                taskId
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "First double-lesson entry has an incorrect task ID.",
                    {
                        taskId,

                        firstTaskId:
                            first.taskId,

                        entryIndex:
                            firstItem.index

                    }
                );

            }


            if (
                second.taskId !==
                taskId
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Second double-lesson entry has an incorrect task ID.",
                    {
                        taskId,

                        secondTaskId:
                            second.taskId,

                        entryIndex:
                            secondItem.index

                    }
                );

            }


            // ------------------------------------------------
            // EXPECTED REQUIREMENT
            // ------------------------------------------------

            const expectedRequirementId =
                normalizeTimetableId(
                    task.requirementId ??
                    task.requirement_id
                );


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
                                first.requirementId,

                            entryIndex:
                                firstItem.index

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
                                second.requirementId,

                            entryIndex:
                                secondItem.index

                        }
                    );

                }

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
            // SAME PARALLEL GROUP
            // ------------------------------------------------

            if (
                first.parallelGroup !==
                second.parallelGroup
            ) {

                addTimetableAuditError(
                    audit,
                    "doubleLessons",
                    "Double lesson changes parallel group between its two periods.",
                    {
                        taskId,

                        firstParallelGroup:
                            first.parallelGroup,

                        secondParallelGroup:
                            second.parallelGroup

                    }
                );

            }


            // ------------------------------------------------
            // SAME PARALLEL OCCURRENCE
            // ------------------------------------------------
            //
            // If the double belongs to a parallel group, both
            // periods must carry the same occurrence identity.
            //
            // ------------------------------------------------

            if (
                first.parallelGroup ||
                second.parallelGroup ||
                first.parallelOccurrenceKey ||
                second.parallelOccurrenceKey
            ) {

                if (
                    !first.parallelOccurrenceKey ||
                    !second.parallelOccurrenceKey
                ) {

                    addTimetableAuditError(
                        audit,
                        "doubleLessons",
                        "Parallel double lesson is missing its occurrence key.",
                        {
                            taskId,

                            firstParallelOccurrenceKey:
                                first.parallelOccurrenceKey,

                            secondParallelOccurrenceKey:
                                second.parallelOccurrenceKey

                        }
                    );

                }
                else if (
                    first.parallelOccurrenceKey !==
                    second.parallelOccurrenceKey
                ) {

                    addTimetableAuditError(
                        audit,
                        "doubleLessons",
                        "Double lesson changes parallel occurrence between its two periods.",
                        {
                            taskId,

                            firstParallelOccurrenceKey:
                                first.parallelOccurrenceKey,

                            secondParallelOccurrenceKey:
                                second.parallelOccurrenceKey

                        }
                    );

                }


                // ------------------------------------------------
                // SAME COMPLETE PARALLEL IDENTITY
                // ------------------------------------------------

                if (
                    first.parallelIdentity !==
                    second.parallelIdentity
                ) {

                    addTimetableAuditError(
                        audit,
                        "doubleLessons",
                        "Double lesson changes parallel identity between its two periods.",
                        {
                            taskId,

                            firstParallelIdentity:
                                first.parallelIdentity,

                            secondParallelIdentity:
                                second.parallelIdentity

                        }
                    );

                }

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
                firstDay !==
                secondDay
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
                            second.periodId,

                        firstDay,

                        secondDay

                    }
                );

            }


            // ------------------------------------------------
            // CONSECUTIVE TEACHING PERIODS
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

    if (
        !Array.isArray(entries)
    ) {

        return;

    }


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
            // ROOM IS REQUIRED
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

                        requirementId,

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
            // Support both normalized and raw room fields:
            //
            //     room.roomTypeId
            //     room.room_type_id
            //
            // Requirement:
            //
            //     requirement.roomTypeId
            //     requirement.room_type_id
            //
            // UUID relationship is authoritative.
            // ------------------------------------------------

            const expectedRoomTypeId =
                normalizeTimetableId(
                    requirement.roomTypeId ??
                    requirement.room_type_id
                );


            const actualRoomTypeId =
                normalizeTimetableId(
                    room.roomTypeId ??
                    room.room_type_id
                );


            // ------------------------------------------------
            // PRIMARY ROOM TYPE ID CHECK
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
                // LEGACY ROOM TYPE TEXT FALLBACK
                // ------------------------------------------------

                const expectedType =
                    normalizeRoomType(
                        requirement.roomType ??
                        requirement.room_type
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
            // ROOM AVAILABILITY
            // ------------------------------------------------
            //
            // Support:
            //     available
            //     isAvailable
            //     is_available
            // ------------------------------------------------

            const roomAvailable =
                room.available ??
                room.isAvailable ??
                room.is_available;


            if (
                roomAvailable === false
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


    const entries =
        Array.isArray(
            result?.entries
        )
            ? result.entries
            : [];


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

                entryIndex:
                    index,

                taskId:
                    normalized.taskId ||
                    null,

                requirementId:
                    normalized.requirementId ||
                    null,

                type:
                    null,

                parallelGroup:
                    normalized.parallelGroup ||
                    null,

                parallelOccurrenceKey:
                    normalized.parallelOccurrenceKey ||
                    null,

                day:
                    period?.dayName ??
                    period?.dayNumber ??
                    null,

                period:
                    period?.periodNumber ??
                    null,

                periodOrder:
                    period?.periodOrder ??
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


    // ========================================================
    // FINAL GENERATED ENTRIES
    // ========================================================
    //
    // IMPORTANT:
    //
    // result.entries is authoritative.
    //
    // This includes:
    //
    //     Stage 6 placements
    //     Stage 7 repairs
    //     moved lessons
    //     repaired lessons
    //
    // Do NOT audit only result.placedTasks.
    // ========================================================

    const entries =
        Array.isArray(
            result.entries
        )
            ? result.entries
            : [];


    // ========================================================
    // BUILD LOOKUPS
    // ========================================================

    const lookups =
        buildTimetableAuditLookups(
            data
        );


    // ========================================================
    // BASIC STATISTICS
    // ========================================================

    audit.statistics.totalEntries =
        entries.length;


    audit.statistics.totalTasks =
        Array.isArray(
            data.lessonTasks
        )
            ? data.lessonTasks.length
            : (
                Number(
                    result.statistics?.totalTasks
                ) || 0
            );


    // --------------------------------------------------------
    // PLACED TASKS
    // --------------------------------------------------------
    //
    // Prefer the final result array when available.
    // Fall back to statistics only when necessary.
    // --------------------------------------------------------

    if (
        Array.isArray(
            result.placedTasks
        )
    ) {

        audit.statistics.placedTasks =
            result.placedTasks.length;

    }
    else {

        audit.statistics.placedTasks =
            Number(
                result.statistics?.placedTasks
            ) || 0;

    }


    // --------------------------------------------------------
    // FAILED TASKS
    // --------------------------------------------------------

    if (
        Array.isArray(
            result.failedTasks
        )
    ) {

        audit.statistics.failedTasks =
            result.failedTasks.length;

    }
    else {

        audit.statistics.failedTasks =
            Number(
                result.statistics?.failedTasks
            ) || 0;

    }


    // ========================================================
    // AUDITED ENTITY COUNTS
    // ========================================================

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


    // ========================================================
    // 2. BASIC ENTITY REFERENCES
    // ========================================================

    auditGeneratedEntityReferences(
        entries,
        audit,
        lookups
    );


    // ========================================================
    // 3. DUPLICATE ENTRIES
    // ========================================================

    auditDuplicateGeneratedEntries(
        entries,
        audit
    );


    // ========================================================
    // 4. STREAM CONFLICTS
    // ========================================================
    //
    // IMPORTANT:
    //
    // The stream audit is occurrence-aware.
    //
    // Same parallel group alone is NOT enough.
    //
    // Same:
    //     parallelGroup
    //     parallelOccurrenceKey
    //     parallelIdentity
    //
    // is required for explicit parallel occupancy.
    // ========================================================

    auditStreamPeriodConflicts(
        entries,
        audit
    );


    // ========================================================
    // 5. TEACHER CONFLICTS
    // ========================================================

    auditTeacherPeriodConflicts(
        entries,
        audit
    );


    // ========================================================
    // 6. ROOM CONFLICTS
    // ========================================================

    auditRoomPeriodConflicts(
        entries,
        audit
    );


    // ========================================================
    // 7. REQUIREMENT WEEKLY TOTALS
    // ========================================================

    auditRequirementWeeklyTotals(
        data,
        entries,
        audit
    );


    // ========================================================
    // 8. DAILY REQUIREMENT LIMITS
    // ========================================================

    auditDailyRequirementLimits(
        data,
        entries,
        audit,
        lookups
    );


    // ========================================================
    // 9. TEACHER DAILY LIMITS
    // ========================================================

    auditTeacherDailyLimits(
        data,
        entries,
        audit,
        lookups
    );


    // ========================================================
    // 10. TEACHER WEEKLY LIMITS
    // ========================================================

    auditTeacherWeeklyLimits(
        entries,
        audit,
        lookups
    );


    // ========================================================
    // 11. TEACHER CONSECUTIVE LIMITS
    // ========================================================

    auditTeacherConsecutiveLimits(
        entries,
        audit,
        lookups
    );


    // ========================================================
    // 12. DOUBLE LESSON STRUCTURE
    // ========================================================
    //
    // Uses final result.entries.
    //
    // Therefore a Stage 7 moved/repaired double lesson is
    // audited in its final position.
    // ========================================================

    auditDoubleLessonStructure(
        data,
        result,
        audit,
        lookups
    );


    // ========================================================
    // 13. ROOM TYPE REQUIREMENTS
    // ========================================================

    auditRoomTypeRequirements(
        data,
        entries,
        audit,
        lookups
    );


    // ========================================================
    // BUILD FINAL HUMAN-READABLE TABLE
    // ========================================================

    const entryTable =
        buildTimetableAuditEntryTable(
            result,
            lookups
        );


    // ========================================================
    // FINAL VALIDITY RECONCILIATION
    // ========================================================
    //
    // addTimetableAuditError() already sets audit.valid=false.
    //
    // This final assignment guarantees the status cannot
    // accidentally remain true if errors were added by any
    // future audit function without updating the flag.
    // ========================================================

    audit.valid =
        audit.errors.length === 0;


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
        "Audited periods:",
        audit.statistics.auditedPeriods
    );


    console.log(
        "Audited requirements:",
        audit.statistics.auditedRequirements
    );


    console.log(
        "Audited teachers:",
        audit.statistics.auditedTeachers
    );


    console.log(
        "Audited rooms:",
        audit.statistics.auditedRooms
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
    // CHECK STATUS TABLE
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
        !Array.isArray(failedTasks) ||
        failedTasks.length === 0
    ) {

        console.log(
            "STAGE 7: No failed tasks. Repair not required."
        );

        return {
            repaired: [],
            entries: [],
            stillFailed: [],
            moved: [],
            repairedCount: 0,
            failedCount: 0
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
            repaired: [],
            entries: [],
            stillFailed: [...failedTasks],
            moved: [],
            repairedCount: 0,
            failedCount: failedTasks.length
        };

    }


    // ========================================================
    // OCCUPANCY INDEXES
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
            repaired: [],
            entries: [],
            stillFailed: [...failedTasks],
            moved: [],
            repairedCount: 0,
            failedCount: failedTasks.length
        };

    }


    // ========================================================
    // PRESERVE STAGE 6 PLACED TASKS
    // ========================================================
    //
    // Relocation needs the actual Stage 6 placed-task list.
    //
    // Make a working copy rather than keeping the caller's
    // array by reference.
    // ========================================================

    generatorData.placedTasks =
        Array.isArray(placedTasks)
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

    const stillFailed = [];

    const moved = [];


    // ========================================================
    // WORKING FAILED-TASK QUEUE
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
        // PROCESS EACH FAILED TASK
        // ====================================================

        for (
            const task of remainingTasks
        ) {

            const taskId =
                task?.taskId ??
                task?.task_id ??
                task?.id ??
                null;


            console.log(
                "Attempting repair:",
                taskId
            );


            const repairResult =
                repairSingleFailedTask(
                    task,
                    generatorData
                );


            // =================================================
            // SUCCESS
            // =================================================

            if (
                repairResult &&
                repairResult.repaired === true
            ) {

                repaired.push(
                    task
                );


                // ------------------------------------------------
                // IMPORTANT:
                // Keep repaired task available for later
                // relocation attempts in the same Stage 7 run.
                // ------------------------------------------------

                const alreadyTracked =
                    generatorData.placedTasks.some(
                        placement => {

                            const existingTask =
                                placement?.task ||
                                placement;


                            const existingTaskId =
                                existingTask?.taskId ??
                                existingTask?.task_id ??
                                existingTask?.id ??
                                null;


                            return (
                                String(existingTaskId) ===
                                String(taskId)
                            );

                        }
                    );


                if (
                    !alreadyTracked
                ) {

                    generatorData.placedTasks.push(
                        task
                    );

                }


                // ------------------------------------------------
                // PRESERVE GENERATED ENTRIES
                // ------------------------------------------------

                if (
                    Array.isArray(
                        repairResult.entries
                    )
                ) {

                    entries.push(
                        ...repairResult.entries
                    );

                }


                // ------------------------------------------------
                // PRESERVE MOVED INFORMATION
                // ------------------------------------------------

                if (
                    Array.isArray(
                        repairResult.moved
                    )
                ) {

                    moved.push(
                        ...repairResult.moved
                    );

                }


                console.log(
                    "✅ STAGE 7 REPAIRED:",
                    taskId
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

                entries:
                    entries.length,

                remaining:
                    remainingTasks.length,

                moved:
                    moved.length
            }
        );


        // ====================================================
        // ALL TASKS REPAIRED
        // ====================================================

        if (
            remainingTasks.length === 0
        ) {

            break;

        }

    }


    // ========================================================
    // FINAL FAILED TASKS
    // ========================================================

    stillFailed.push(
        ...remainingTasks
    );


    // ========================================================
    // FINAL LOGGING
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
// STAGE 7 — REPAIR ONE FAILED TASK
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
            repaired: false,
            entries: [],
            moved: []
        };

    }


    // ========================================================
    // NORMALIZE TASK TYPE
    // ========================================================

    const taskType =
        String(
            task.taskType ??
            task.task_type ??
            task.type ??
            ""
        ).toLowerCase();


    const isDouble =
        taskType === "double" ||
        task.isDouble === true;


    // ========================================================
    // DOUBLE LESSONS
    // ========================================================
    //
    // Stage 7 currently does not relocate doubles unless the
    // configuration explicitly enables it.
    // ========================================================

    if (
        isDouble &&
        STAGE7_CONFIG.allowMovingDoubleLessons !== true
    ) {

        console.log(
            "STAGE 7: Double lesson repair is disabled:",
            task?.taskId ??
            task?.task_id ??
            task?.id
        );

        return {
            repaired: false,
            entries: [],
            moved: []
        };

    }


    // ========================================================
    // GENERATOR DATA
    // ========================================================

    const periods =
        Array.isArray(
            generatorData.periods
        )
            ? generatorData.periods
            : [];


    const rooms =
        Array.isArray(
            generatorData.rooms
        )
            ? generatorData.rooms
            : [];


    const indexes =
        generatorData.indexes;


    if (
        !indexes
    ) {

        return {
            repaired: false,
            entries: [],
            moved: []
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
            repaired: false,
            entries: [],
            moved: []
        };

    }


    // ========================================================
    // BUILD ROOM CANDIDATES
    // ========================================================

    const candidateRooms =
        buildStage7RoomCandidates(
            task,
            rooms
        );


    if (
        !Array.isArray(candidateRooms) ||
        candidateRooms.length === 0
    ) {

        console.warn(
            "STAGE 7: No compatible rooms available for task:",
            task?.taskId ??
            task?.task_id ??
            task?.id
        );

        return {
            repaired: false,
            entries: [],
            moved: []
        };

    }


    let attempts = 0;


    // ========================================================
    // DIRECT SINGLE-LESSON REPAIR
    // ========================================================

    if (
        !isDouble
    ) {

        for (
            const period of candidatePeriods
        ) {

            if (
                attempts >=
                STAGE7_CONFIG.maxCandidatesPerTask
            ) {

                break;

            }


            for (
                const room of candidateRooms
            ) {

                if (
                    attempts >=
                    STAGE7_CONFIG.maxCandidatesPerTask
                ) {

                    break;

                }


                attempts++;


                // =================================================
                // FINAL CONFLICT CHECK
                // =================================================

                const conflict =
                    checkSingleSlotConflict(
                        task,
                        period,
                        room,
                        indexes
                    );


                if (
                    !conflict ||
                    conflict.valid !== true
                ) {

                    continue;

                }


                // =================================================
                // ACTUAL STAGE 7 PLACEMENT
                // =================================================

                const placement =
                    placeStage7Task(
                        task,
                        period,
                        room,
                        generatorData
                    );


                if (
                    !placement ||
                    placement.placed !== true
                ) {

                    console.warn(
                        "STAGE 7 DIRECT PLACEMENT REJECTED:",
                        {
                            taskId:
                                task?.taskId ??
                                task?.task_id ??
                                task?.id,

                            periodId:
                                period?.id,

                            roomId:
                                room?.id ??
                                null,

                            reason:
                                placement?.reason ||
                                "Unknown placement failure."
                        }
                    );


                    continue;

                }


                // =================================================
                // SUCCESS
                // =================================================

                return {

                    repaired:
                        true,

                    entries:
                        Array.isArray(
                            placement.entries
                        )
                            ? placement.entries
                            : [],

                    moved:
                        []

                };

            }

        }

    }


    // ========================================================
    // DIRECT REPAIR FAILED
    //
    // TRY RELOCATING AN EXISTING SINGLE LESSON
    // ========================================================

    if (
        !isDouble &&
        STAGE7_CONFIG.allowMovingSingleLessons === true
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
            moveResult.repaired === true
        ) {

            return {

                repaired:
                    true,

                entries:
                    Array.isArray(
                        moveResult.entries
                    )
                        ? moveResult.entries
                        : [],

                moved:
                    Array.isArray(
                        moveResult.moved
                    )
                        ? moveResult.moved
                        : []

            };

        }

    }


    // ========================================================
    // FINAL FAILURE
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
// STAGE 7 — BUILD PERIOD CANDIDATES
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


    // ========================================================
    // ONLY TEACHING PERIODS
    // ========================================================
    //
    // Stage 7 must never try to repair a lesson into:
    //
    //     break
    //     lunch
    //     assembly
    //     non-teaching
    //
    // Normalized periods use:
    //
    //     isTeachingPeriod
    // ========================================================

    const candidates =
        periods
            .filter(
                period => {

                    if (
                        !period ||
                        !period.id
                    ) {

                        return false;

                    }


                    const isTeachingPeriod =
                        period.isTeachingPeriod ??
                        period.is_teaching_period;


                    if (
                        isTeachingPeriod === false
                    ) {

                        return false;

                    }


                    return true;

                }
            )
            .map(
                period => ({
                    ...period
                })
            );


    // ========================================================
    // SORT CHRONOLOGICALLY
    // ========================================================
    //
    // IMPORTANT:
    //
    // The normalized timetable model uses:
    //
    //     dayNumber
    //     periodOrder
    //
    // with snake_case only as fallback.
    // ========================================================

    candidates.sort(
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


            if (
                orderA !==
                orderB
            ) {

                return (
                    orderA -
                    orderB
                );

            }


            return String(
                a.id
            ).localeCompare(
                String(b.id)
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
    // NO ROOM REQUIRED
    // ========================================================
    //
    // A roomless lesson must use null.
    //
    // Do NOT allow Stage 7 to randomly assign a room.
    // ========================================================

    if (
        !requiresRoom
    ) {

        return [
            null
        ];

    }


    // ========================================================
    // ROOM REQUIRED BUT NONE AVAILABLE
    // ========================================================

    if (
        !Array.isArray(rooms) ||
        rooms.length === 0
    ) {

        return [];

    }


    // ========================================================
    // VALID ROOMS
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
    // AUTHORITATIVE ROOM TYPE REQUIREMENT
    // ========================================================
    //
    // Support normalized and raw requirement fields.
    // ========================================================

    const requiredRoomTypeId =
        normalizeTimetableId(
            task.roomTypeId ??
            task.room_type_id ??
            task.requiredRoomTypeId ??
            task.required_room_type_id ??
            null
        );


    // ========================================================
    // FILTER BY ROOM TYPE ID
    // ========================================================

    if (
        requiredRoomTypeId
    ) {

        const compatibleRooms =
            validRooms.filter(
                room => {

                    const roomTypeId =
                        normalizeTimetableId(
                            room.roomTypeId ??
                            room.room_type_id ??
                            room.typeId ??
                            room.type_id ??
                            null
                        );


                    return (
                        roomTypeId &&
                        roomTypeId ===
                        requiredRoomTypeId
                    );

                }
            );


        return compatibleRooms;

    }


    // ========================================================
    // LEGACY ROOM TYPE TEXT FALLBACK
    // ========================================================
    //
    // If the task has no room-type UUID but does carry a
    // textual room type, respect it.
    // ========================================================

    const requiredRoomType =
        normalizeRoomType(
            task.roomType ??
            task.room_type ??
            task.requiredRoomType ??
            task.required_room_type
        );


    if (
        requiredRoomType
    ) {

        return validRooms.filter(
            room => {

                const actualRoomType =
                    normalizeRoomType(
                        getTimetableRoomType(
                            room
                        )
                    );


                return (
                    actualRoomType ===
                    requiredRoomType
                );

            }
        );

    }


    // ========================================================
    // NO SPECIFIC ROOM TYPE
    // ========================================================
    //
    // Any valid room may be used.
    // ========================================================

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
        !generatorData ||
        !generatorData.indexes
    ) {

        return {
            placed: false,
            entries: [],
            reason:
                "Invalid Stage 7 placement data."
        };

    }


    // ========================================================
    // NORMALIZE TASK TYPE
    // ========================================================

    const taskType =
        String(
            task.taskType ??
            task.task_type ??
            task.type ??
            ""
        ).toLowerCase();


    const isDouble =
        taskType === "double" ||
        task.isDouble === true;


    // ========================================================
    // DOUBLE LESSONS ARE NOT SUPPORTED BY THIS ADAPTER
    // ========================================================

    if (
        isDouble
    ) {

        console.warn(
            "STAGE 7: Double lesson placement adapter is not enabled.",
            task?.taskId ??
            task?.task_id ??
            task?.id
        );

        return {
            placed: false,
            entries: [],
            reason:
                "Stage 7 double-lesson relocation is disabled."
        };

    }


    // ========================================================
    // BUILD CANDIDATE
    // ========================================================

    const candidate = {

        taskId:
            task.taskId ??
            task.task_id ??
            task.id ??
            null,

        period,

        room:
            room || null,

        score:
            0,

        reasons: [
            "Stage 7 repair candidate."
        ]

    };


    // ========================================================
    // FINAL PLACEMENT ENGINE
    // ========================================================
    //
    // Do not duplicate reservation or entry-generation logic
    // here.
    //
    // placeSelectedSingleTask() already performs:
    //
    //     conflict validation
    //     reserveSlot()
    //     createGeneratedEntry()
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
            placed: false,
            entries: [],
            reason:
                placement?.reason ||
                "Stage 7 single-lesson placement failed."
        };

    }


    // ========================================================
    // VERIFY GENERATED ENTRIES
    // ========================================================

    const generatedEntries =
        Array.isArray(
            placement.entries
        )
            ? placement.entries
            : [];


    if (
        generatedEntries.length === 0
    ) {

        console.error(
            "STAGE 7: Placement reported success but generated no entries.",
            {
                taskId:
                    task?.taskId ??
                    task?.task_id ??
                    task?.id,

                periodId:
                    period?.id,

                roomId:
                    room?.id ??
                    null
            }
        );


        return {
            placed: false,
            entries: [],
            reason:
                "Stage 7 placement succeeded without generating an entry."
        };

    }


    // ========================================================
    // SUCCESS
    // ========================================================

    return {

        placed:
            true,

        entries:
            generatedEntries,

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
// IMPORTANT:
//
// The existing lesson is:
//     1. temporarily released
//     2. tested at an alternative location
//     3. restored before this function returns an alternative
//     4. actually moved only after an alternative is confirmed
//
// This guarantees that simply SEARCHING for a relocation does
// not permanently modify the timetable.
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
            repaired: false,
            entries: [],
            moved: []
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
            repaired: false,
            entries: [],
            moved: []
        };

    }


    let moveAttempts = 0;


    // ========================================================
    // FAILED TASK ID
    // ========================================================

    const failedTaskId =
        failedTask.taskId ??
        failedTask.task_id ??
        failedTask.id ??
        null;


    // ========================================================
    // LOOK FOR A SINGLE LESSON TO MOVE
    // ========================================================

    for (
        const placement of placedTasks
    ) {

        if (
            !placement
        ) {

            continue;

        }


        // ----------------------------------------------------
        // placedTasks may contain either:
        //
        //     task
        //
        // or:
        //
        //     { task, entries }
        //
        // Normalize both forms.
        // ----------------------------------------------------

        const existingTask =
            placement?.task ||
            placement;


        if (
            !existingTask
        ) {

            continue;

        }


        // ----------------------------------------------------
        // NEVER MOVE THE FAILED TASK ITSELF
        // ----------------------------------------------------

        const existingTaskId =
            existingTask.taskId ??
            existingTask.task_id ??
            existingTask.id ??
            null;


        if (
            failedTaskId &&
            existingTaskId &&
            String(existingTaskId) ===
            String(failedTaskId)
        ) {

            continue;

        }


        // ----------------------------------------------------
        // NORMALIZE TASK TYPE
        // ----------------------------------------------------

        const existingTaskType =
            String(
                existingTask.taskType ??
                existingTask.task_type ??
                existingTask.type ??
                ""
            ).toLowerCase();


        const existingIsDouble =
            existingTaskType === "double" ||
            existingTask.isDouble === true;


        // ----------------------------------------------------
        // NEVER MOVE DOUBLE LESSONS
        // ----------------------------------------------------

        if (
            existingIsDouble
        ) {

            continue;

        }


        // ====================================================
        // MOVE LIMIT
        // ====================================================

        if (
            moveAttempts >=
            STAGE7_CONFIG.maxMovesPerTask
        ) {

            break;

        }


        // ====================================================
        // FIND SAFE ALTERNATIVE
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
        // ACTUALLY MOVE EXISTING TASK
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
        // ====================================================

        const movedEntry =
            existingTask.stage7MovedEntry ||
            null;


        if (
            !movedEntry
        ) {

            console.error(
                "STAGE 7: Existing task moved but no generated entry was produced.",
                {
                    taskId:
                        existingTaskId,

                    periodId:
                        alternative.period?.id,

                    roomId:
                        alternative.room?.id ??
                        null
                }
            );


            // -----------------------------------------------
            // Attempt immediate rollback.
            // -----------------------------------------------

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
                    "STAGE 7: CRITICAL — failed to restore task after missing moved entry."
                );

            }


            existingTask.stage7MovedEntry =
                null;


            continue;

        }


        // ====================================================
        // BUILD FAILED-TASK ROOM CANDIDATES
        // ====================================================

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

            // ------------------------------------------------
            // Restore existing task.
            // ------------------------------------------------

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
                    "STAGE 7: CRITICAL — failed to restore existing task after failed-task room failure.",
                    {
                        taskId:
                            existingTaskId
                    }
                );

                return {
                    repaired: false,
                    entries: [],
                    moved: []
                };

            }


            existingTask.stage7MovedEntry =
                null;


            continue;

        }


        // ====================================================
        // ORDER FAILED-TASK ROOMS
        // ====================================================
        //
        // Prefer the room already validated during the
        // relocation search.
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

            const alreadyIncluded =
                orderedFailedTaskRooms.some(
                    candidate => {

                        if (
                            !candidate ||
                            !failedRoom
                        ) {

                            return false;

                        }

                        return (
                            String(candidate.id) ===
                            String(failedRoom.id)
                        );

                    }
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

            const conflict =
                checkSingleSlotConflict(
                    failedTask,
                    alternative.oldPeriod,
                    failedRoom,
                    generatorData.indexes
                );


            if (
                !conflict ||
                conflict.valid !== true
            ) {

                continue;

            }


            const placementResult =
                placeStage7Task(
                    failedTask,
                    alternative.oldPeriod,
                    failedRoom,
                    generatorData
                );


            if (
                placementResult &&
                placementResult.placed === true
            ) {

                failedTaskPlacement =
                    placementResult;

                break;

            }

        }


        // ====================================================
        // BOTH MOVES SUCCESSFUL
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


            repairedEntries.push(
                movedEntry
            );


            // =================================================
            // MOVE RECORD
            // =================================================

            const movedRecord = {

                task:
                    existingTask,

                from: {

                    period:
                        alternative.oldPeriod,

                    room:
                        alternative.oldRoom

                },

                to: {

                    period:
                        alternative.period,

                    room:
                        alternative.room

                }

            };


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
        //
        // ROLLBACK EXISTING TASK.
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
                        existingTaskId,

                    originalPeriod:
                        alternative.oldPeriod?.id,

                    originalRoom:
                        alternative.oldRoom?.id ??
                        null,

                    attemptedPeriod:
                        alternative.period?.id,

                    attemptedRoom:
                        alternative.room?.id ??
                        null
                }
            );


            existingTask.stage7MovedEntry =
                null;


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
        !generatorData ||
        !generatorData.indexes
    ) {

        return null;

    }


    const indexes =
        generatorData.indexes;


    // ========================================================
    // FIND CURRENT LOCATION
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
    // BUILD EXISTING-TASK ROOMS
    // ========================================================

    const existingTaskRooms =
        buildStage7RoomCandidates(
            existingTask,
            rooms
        );


    if (
        !Array.isArray(existingTaskRooms) ||
        existingTaskRooms.length === 0
    ) {

        return null;

    }


    // ========================================================
    // BUILD FAILED-TASK ROOMS
    // ========================================================

    const failedTaskRooms =
        buildStage7RoomCandidates(
            failedTask,
            rooms
        );


    if (
        !Array.isArray(failedTaskRooms) ||
        failedTaskRooms.length === 0
    ) {

        return null;

    }


    // ========================================================
    // TEMPORARILY RELEASE EXISTING TASK
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
            "STAGE 7: Could not temporarily release existing task.",
            {
                taskId:
                    existingTask?.taskId ??
                    existingTask?.task_id ??
                    existingTask?.id,

                oldPeriod:
                    oldPeriod?.id,

                oldRoom:
                    oldRoom?.id ??
                    null
            }
        );

        return null;

    }


    let alternative =
        null;


    // ========================================================
    // SEARCH
    // ========================================================

    outerLoop:
    for (
        const period of candidatePeriods
    ) {

        if (
            !period ||
            !period.id
        ) {

            continue;

        }


        // ----------------------------------------------------
        // SAME PERIOD IS NOT AN ALTERNATIVE
        // ----------------------------------------------------

        if (
            String(period.id) ===
            String(oldPeriod.id)
        ) {

            continue;

        }


        // ----------------------------------------------------
        // ONLY TEACHING PERIODS
        // ----------------------------------------------------

        const isTeachingPeriod =
            period.isTeachingPeriod ??
            period.is_teaching_period;


        if (
            isTeachingPeriod === false
        ) {

            continue;

        }


        for (
            const room of existingTaskRooms
        ) {

            // =================================================
            // TEST EXISTING TASK AT NEW LOCATION
            // =================================================

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


            // =================================================
            // TEST FAILED TASK AT FREED LOCATION
            // =================================================

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
                    !failedTaskConflict ||
                    failedTaskConflict.valid !== true
                ) {

                    continue;

                }


                // =================================================
                // VALID TWO-MOVE CHAIN FOUND
                // =================================================

                alternative = {

                    period,

                    room,

                    oldPeriod,

                    oldRoom,

                    failedRoom

                };


                break outerLoop;

            }

        }

    }


    // ========================================================
    // RESTORE ORIGINAL RESERVATION
    // ========================================================
    //
    // We have NOT actually moved the task yet.
    //
    // Therefore the indexes must be returned to their original
    // state before this function returns.
    // ========================================================

    const originalSlotConflict =
        checkSingleSlotConflict(
            existingTask,
            oldPeriod,
            oldRoom,
            indexes
        );


    if (
        !originalSlotConflict ||
        originalSlotConflict.valid !== true
    ) {

        console.error(
            "STAGE 7: CRITICAL — original task slot became invalid while searching for relocation.",
            {
                taskId:
                    existingTask?.taskId ??
                    existingTask?.task_id ??
                    existingTask?.id,

                oldPeriod:
                    oldPeriod?.id,

                oldRoom:
                    oldRoom?.id ??
                    null
            }
        );


        return null;

    }


    const restored =
        reserveSlot(
            existingTask,
            oldPeriod,
            oldRoom,
            indexes
        );


    if (
        restored !== true
    ) {

        console.error(
            "STAGE 7: CRITICAL — failed to restore original task reservation.",
            {
                taskId:
                    existingTask?.taskId ??
                    existingTask?.task_id ??
                    existingTask?.id,

                oldPeriod:
                    oldPeriod?.id,

                oldRoom:
                    oldRoom?.id ??
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
// Moves an existing SINGLE lesson from its current slot to:
//
//     newPeriod
//     newRoom
//
// Uses:
//
//     releaseReservedSlot()
//     checkSingleSlotConflict()
//     reserveSlot()
//     createGeneratedEntry()
//
// Double lessons are intentionally excluded.
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
    // CLEAR TEMPORARY ENTRY
    // ========================================================

    task.stage7MovedEntry =
        null;


    // ========================================================
    // NORMALIZE TASK TYPE
    // ========================================================

    const taskType =
        String(
            task.taskType ??
            task.task_type ??
            task.type ??
            ""
        ).toLowerCase();


    const isDouble =
        taskType === "double" ||
        task.isDouble === true;


    if (
        isDouble
    ) {

        console.warn(
            "STAGE 7: Double lesson movement is disabled.",
            task?.taskId ??
            task?.task_id ??
            task?.id
        );

        return false;

    }


    // ========================================================
    // FIND CURRENT SLOT
    // ========================================================

    const oldPeriod =
        rollbackPeriod ||
        findTaskPeriod(
            task,
            generatorData
        );


    const oldRoom =
        rollbackPeriod
            ? (
                rollbackRoom ||
                null
            )
            : (
                findTaskRoom(
                    task,
                    generatorData
                )
            );


    if (
        !oldPeriod
    ) {

        console.warn(
            "STAGE 7: Cannot move task because current period was not found.",
            {
                taskId:
                    task?.taskId ??
                    task?.task_id ??
                    task?.id
            }
        );

        return false;

    }


    // ========================================================
    // SAME SLOT CHECK
    // ========================================================

    const oldRoomId =
        oldRoom?.id ??
        null;


    const newRoomId =
        newRoom?.id ??
        null;


    if (
        String(oldPeriod.id) ===
        String(newPeriod.id) &&
        String(oldRoomId ?? "") ===
        String(newRoomId ?? "")
    ) {

        return false;

    }


    // ========================================================
    // RELEASE OLD SLOT
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
                    task?.taskId ??
                    task?.task_id ??
                    task?.id,

                oldPeriod:
                    oldPeriod?.id,

                oldRoom:
                    oldRoomId
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
        // Restore old slot.
        // ----------------------------------------------------

        const oldSlotAvailable =
            checkSingleSlotConflict(
                task,
                oldPeriod,
                oldRoom,
                indexes
            );


        if (
            oldSlotAvailable &&
            oldSlotAvailable.valid === true
        ) {

            reserveSlot(
                task,
                oldPeriod,
                oldRoom,
                indexes
            );

        }
        else {

            console.error(
                "STAGE 7: CRITICAL — old slot cannot be restored.",
                {
                    taskId:
                        task?.taskId ??
                        task?.task_id ??
                        task?.id,

                    oldPeriod:
                        oldPeriod?.id,

                    oldRoom:
                        oldRoomId,

                    newPeriod:
                        newPeriod?.id,

                    newRoom:
                        newRoomId,

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
        // Restore old slot.
        // ----------------------------------------------------

        const oldSlotAvailable =
            checkSingleSlotConflict(
                task,
                oldPeriod,
                oldRoom,
                indexes
            );


        if (
            oldSlotAvailable &&
            oldSlotAvailable.valid === true
        ) {

            const restored =
                reserveSlot(
                    task,
                    oldPeriod,
                    oldRoom,
                    indexes
                );


            if (
                restored !== true
            ) {

                console.error(
                    "STAGE 7: CRITICAL — failed to restore original slot after reservation failure.",
                    {
                        taskId:
                            task?.taskId ??
                            task?.task_id ??
                            task?.id
                    }
                );

            }

        }
        else {

            console.error(
                "STAGE 7: CRITICAL — original slot is no longer available after reservation failure.",
                {
                    taskId:
                        task?.taskId ??
                        task?.task_id ??
                        task?.id,

                    oldPeriod:
                        oldPeriod?.id,

                    oldRoom:
                        oldRoomId
                }
            );

        }


        return false;

    }


    // ========================================================
    // CREATE NEW ENTRY
    // ========================================================

    const newEntry =
        createGeneratedEntry(
            task,
            newPeriod,
            newRoom
        );


    if (
        !newEntry
    ) {

        // ----------------------------------------------------
        // Release newly reserved slot.
        // ----------------------------------------------------

        releaseReservedSlot(
            task,
            newPeriod,
            newRoom,
            indexes
        );


        // ----------------------------------------------------
        // Restore original slot.
        // ----------------------------------------------------

        const oldSlotAvailable =
            checkSingleSlotConflict(
                task,
                oldPeriod,
                oldRoom,
                indexes
            );


        if (
            oldSlotAvailable &&
            oldSlotAvailable.valid === true
        ) {

            const restored =
                reserveSlot(
                    task,
                    oldPeriod,
                    oldRoom,
                    indexes
                );


            if (
                restored !== true
            ) {

                console.error(
                    "STAGE 7: CRITICAL — failed to restore original slot after entry creation failure.",
                    {
                        taskId:
                            task?.taskId ??
                            task?.task_id ??
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
                        task?.taskId ??
                        task?.task_id ??
                        task?.id,

                    oldPeriod:
                        oldPeriod?.id,

                    oldRoom:
                        oldRoomId
                }
            );

        }


        return false;

    }


    // ========================================================
    // ONLY NOW UPDATE TASK LOCATION
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
        newRoom?.id ??
        null;


    task.room_id =
        newRoom?.id ??
        null;


    // ========================================================
    // STORE TEMPORARY STAGE 7 ENTRY
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
                task?.taskId ??
                task?.task_id ??
                task?.id,

            fromPeriod:
                oldPeriod?.id ??
                null,

            fromRoom:
                oldRoomId,

            toPeriod:
                newPeriod?.id ??
                null,

            toRoom:
                newRoomId
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
