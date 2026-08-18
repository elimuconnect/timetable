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
// STAGE 2 — BUILD GENERATOR DATA
// ============================================================

async function buildGeneratorData() {

    if (!timetableState.schoolId) {

        throw new Error(
            "No school selected."
        );

    }


    console.log(
        "======================================"
    );

    console.log(
        "STAGE 2 — BUILD GENERATOR DATA"
    );

    console.log(
        "School:",
        timetableState.schoolId
    );

    console.log(
        "======================================"
    );


    const [
        periodsResult,
        requirementsResult,
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
            .from("timetable_requirements")
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


    // ----------------------------------------------------------
    // DATABASE ERRORS
    // ----------------------------------------------------------

    const results = [
        {
            name: "periods",
            result: periodsResult
        },
        {
            name: "requirements",
            result: requirementsResult
        },
        {
            name: "streams",
            result: streamsResult
        },
        {
            name: "subjects",
            result: subjectsResult
        },
        {
            name: "teachers",
            result: teachersResult
        },
        {
            name: "rooms",
            result: roomsResult
        }
    ];


    const failed =
        results.find(
            item => item.result.error
        );


    if (failed) {

        throw new Error(
            `Failed to load timetable ${failed.name}: ` +
            failed.result.error.message
        );

    }


    // ----------------------------------------------------------
    // NORMALIZE
    // ----------------------------------------------------------

    const normalized =
        normalizeGeneratorData({

            school: {
                id:
                    timetableState.schoolId
            },

            periods:
                periodsResult.data || [],

            requirements:
                requirementsResult.data || [],

            streams:
                streamsResult.data || [],

            subjects:
                subjectsResult.data || [],

            teachers:
                teachersResult.data || [],

            rooms:
                roomsResult.data || []

        });


    // ----------------------------------------------------------
    // VALIDATE RELATIONSHIPS
    // ----------------------------------------------------------

    const validation =
        validateGeneratorRelationships(
            normalized
        );


    // ----------------------------------------------------------
    // SAVE GLOBAL STATE
    // ----------------------------------------------------------

    generatorData.school =
        normalized.school;

    generatorData.streams =
        normalized.streams;

    generatorData.subjects =
        normalized.subjects;

    generatorData.teachers =
        normalized.teachers;

    generatorData.rooms =
        normalized.rooms;

    generatorData.periods =
        normalized.periods;

    generatorData.requirements =
        normalized.requirements;

    generatorData.lookup =
        normalized.lookup;


    // ----------------------------------------------------------
    // CONSOLE REPORT
    // ----------------------------------------------------------

    console.log(
        "--------------------------------------"
    );

    console.log(
        "GENERATOR DATA READY"
    );

    console.log(
        "Streams:",
        generatorData.streams.length
    );

    console.log(
        "Subjects:",
        generatorData.subjects.length
    );

    console.log(
        "Teachers:",
        generatorData.teachers.length
    );

    console.log(
        "Rooms:",
        generatorData.rooms.length
    );

    console.log(
        "Periods:",
        generatorData.periods.length
    );

    console.log(
        "Requirements:",
        generatorData.requirements.length
    );

    console.log(
        "Relationship errors:",
        validation.errors.length
    );

    console.log(
        "Warnings:",
        validation.warnings.length
    );

    console.log(
        "--------------------------------------"
    );


    console.table(
        validation.errors
    );

    console.table(
        validation.warnings
    );


    return {
        data:
            generatorData,

        validation
    };
}







