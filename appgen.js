

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
// DOM CHECK
// ============================================================

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
            !!printTimetableBtn
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
        return;
    }


    status.style.display =
        "block";


    status.innerHTML = `
        <div class="timetable-status ${type}">
            ${escapeHtml(message)}
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

    if (status) {

        status.style.display =
            "none";

        status.innerHTML =
            "";

    }

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


    // --------------------------------------------------------
    // LOAD ALL DATA IN PARALLEL
    // --------------------------------------------------------

    const [

        requirementsResult,

        periodsResult,

        streamsResult,

        subjectsResult,

        teachersResult,

        roomsResult

    ] = await Promise.all([


        supabaseClient

            .from(
                "timetable_requirements"
            )

            .select("*")

            .eq(
                "school_id",
                timetableState.schoolId
            ),


        supabaseClient

            .from(
                "timetable_periods"
            )

            .select("*")

            .eq(
                "school_id",
                timetableState.schoolId
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

            .from(
                "timetable_streams"
            )

            .select("*")

            .eq(
                "school_id",
                timetableState.schoolId
            ),


        supabaseClient

            .from(
                "timetable_subjects"
            )

            .select("*")

            .eq(
                "school_id",
                timetableState.schoolId
            ),


        supabaseClient

            .from(
                "timetable_teachers"
            )

            .select("*")

            .eq(
                "school_id",
                timetableState.schoolId
            ),


        supabaseClient

            .from(
                "timetable_rooms"
            )

            .select("*")

            .eq(
                "school_id",
                timetableState.schoolId
            )

    ]);


    // --------------------------------------------------------
    // CHECK ERRORS
    // --------------------------------------------------------

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
        item => {

            streams.set(
                item.id,
                item
            );

        }
    );


    data.subjects.forEach(
        item => {

            subjects.set(
                item.id,
                item
            );

        }
    );


    data.teachers.forEach(
        item => {

            teachers.set(
                item.id,
                item
            );

        }
    );


    data.rooms.forEach(
        item => {

            rooms.set(
                item.id,
                item
            );

        }
    );


    data.periods.forEach(
        item => {

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
// GET DISPLAY NAME
// ============================================================

function getTimetableStreamName(
    stream
) {

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
// GET SUBJECT NAME
// ============================================================

function getTimetableSubjectName(
    subject
) {

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
// GET TEACHER NAME
// ============================================================

function getTimetableTeacherName(
    teacher
) {

    if (!teacher) {
        return "Unassigned";
    }


    return (

        teacher.teacher_name ||

        teacher.name ||

        teacher.full_name ||

        [
            teacher.first_name,
            teacher.last_name
        ]
            .filter(Boolean)
            .join(" ") ||

        teacher.username ||

        "Unknown Teacher"

    );

}


// ============================================================
// GET ROOM NAME
// ============================================================

function getTimetableRoomName(
    room
) {

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

function normalizeRoomType(
    value
) {

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

function getTimetableRoomType(
    room
) {

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

function validateTimetableGeneratorData(
    data
) {

    const errors = [];


    if (
        !data.requirements ||
        data.requirements.length === 0
    ) {

        errors.push(
            "No timetable requirements have been configured."
        );

    }


    if (
        !data.periods ||
        data.periods.length === 0
    ) {

        errors.push(
            "No timetable periods have been configured."
        );

    }


    if (
        !data.streams ||
        data.streams.length === 0
    ) {

        errors.push(
            "No streams have been configured."
        );

    }


    if (
        !data.subjects ||
        data.subjects.length === 0
    ) {

        errors.push(
            "No subjects have been configured."
        );

    }


    if (
        !data.teachers ||
        data.teachers.length === 0
    ) {

        errors.push(
            "No teachers have been configured."
        );

    }


    if (errors.length > 0) {

        throw new Error(
            errors.join("\n")
        );

    }


    return true;

}


// ============================================================
// GET TEACHING PERIODS
// ============================================================

function getTeachingPeriods(
    periods
) {

    return periods.filter(
        period => {

            return (

                period.is_teaching_period !== false &&

                period.period_type !== "break" &&

                period.period_type !== "lunch"

            );

        }
    );

}


// ============================================================
// GROUP PERIODS BY DAY
// ============================================================

function groupPeriodsByDay(
    periods
) {

    const groups = {};


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

                        return (

                            Number(
                                a.period_order || 0
                            ) -

                            Number(
                                b.period_order || 0
                            )

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
// Each requirement:
//
// lessons_per_week = 5
//
// becomes 5 individual lesson tasks.
//
// Double lessons are marked separately.
// ============================================================

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
//   Double block 1 = 2 periods
//   Double block 2 = 2 periods
//   Single lesson  = 1 period
//
// Total = 5 periods
//
// ============================================================

function createLessonTasks(
    requirements,
    lookup
) {

    const tasks = [];


    requirements.forEach(
        requirement => {

            const lessonsPerWeek =
                Number(
                    requirement.lessons_per_week
                ) || 0;


            const doubleLessons =
                Math.max(
                    0,
                    Number(
                        requirement.double_lessons_per_week
                    ) || 0
                );


            if (
                lessonsPerWeek <= 0
            ) {

                return;

            }


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


            if (!stream) {

                console.warn(
                    "Requirement references missing stream:",
                    requirement
                );

                return;

            }


            if (!subject) {

                console.warn(
                    "Requirement references missing subject:",
                    requirement
                );

                return;

            }


            if (
                requirement.teacher_id &&
                !teacher
            ) {

                console.warn(
                    "Requirement references missing teacher:",
                    requirement
                );

            }


            // ------------------------------------------------
            // HOW MANY DOUBLE BLOCKS CAN ACTUALLY FIT?
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
            // REMAINING SINGLE LESSONS
            // ------------------------------------------------

            const singleLessons =
                lessonsPerWeek -
                (
                    requestedDoubleBlocks * 2
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


    // --------------------------------------------------------
    // DOUBLE LESSONS FIRST
    // --------------------------------------------------------

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
// SHUFFLE ARRAY
// ============================================================

function shuffleArray(
    array
) {

    const result =
        [...array];


    for (
        let i =
            result.length - 1;

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
        first.day_number !==
        second.day_number
    ) {

        return false;

    }


    // --------------------------------------------------------
    // Prefer period_order.
    // --------------------------------------------------------

    if (
        first.period_order !== undefined &&
        second.period_order !== undefined
    ) {

        return (
            Number(
                second.period_order
            ) ===
            Number(
                first.period_order
            ) + 1
        );

    }


    // --------------------------------------------------------
    // Fallback to period number.
    // --------------------------------------------------------

    return (
        Number(
            second.period_number
        ) ===
        Number(
            first.period_number
        ) + 1
    );

}


// ============================================================
// GET AVAILABLE ROOMS
// ============================================================

function getCompatibleRooms(
    task,
    rooms
) {

    // --------------------------------------------------------
    // No room required
    // --------------------------------------------------------

    if (
        !task.requiresRoom
    ) {

        return [null];

    }


    const requestedType =
        normalizeRoomType(
            task.roomType
        );


    // --------------------------------------------------------
    // If room required but no type specified,
    // any room is acceptable.
    // --------------------------------------------------------

    if (!requestedType) {

        return rooms.length
            ? shuffleArray(rooms)
            : [];

    }


    // --------------------------------------------------------
    // Match room type.
    // --------------------------------------------------------

    return shuffleArray(
        rooms.filter(
            room => {

                const roomType =
                    getTimetableRoomType(
                        room
                    );


                return (
                    roomType ===
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

        streamPeriod:
            new Set(),

        teacherPeriod:
            new Set(),

        roomPeriod:
            new Set(),

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
// CHECK SLOT CONFLICT
// ============================================================

function checkSingleSlotConflict(
    task,
    period,
    room,
    indexes
) {

    // --------------------------------------------------------
    // STREAM
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // TEACHER
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // ROOM
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // DAILY MAXIMUM
    // --------------------------------------------------------

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
// CREATE ENTRY OBJECT
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
// FIND SINGLE LESSON SLOT
// ============================================================

function findSingleLessonSlot(
    task,
    periods,
    rooms,
    indexes
) {

    const shuffledPeriods =
        shuffleArray(periods);

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

        if (
            compatibleRooms.length === 0
        ) {

            console.warn(
                "NO COMPATIBLE ROOMS",
                {
                    taskId: task.taskId,
                    requiresRoom: task.requiresRoom,
                    requestedRoomType: task.roomType,
                    availableRooms: rooms.map(
                        room => ({
                            id: room.id,
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

            console.log(
                "SLOT FOUND",
                {
                    taskId:
                        task.taskId,

                    period:
                        period,

                    room:
                        room
                }
            );

            return {
                period,
                room
            };
        }
    }

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

    for (
        const day of days
    ) {

        const dayPeriods =
            periodsByDay[day];

        for (
            let i = 0;
            i < dayPeriods.length - 1;
            i++
        ) {

            const firstPeriod =
                dayPeriods[i];

            const secondPeriod =
                dayPeriods[i + 1];

            if (
                !arePeriodsConsecutive(
                    firstPeriod,
                    secondPeriod
                )
            ) {

                continue;
            }

            consecutivePairs++;

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
                currentCount + 2 > maxPerDay
            ) {

                dailyLimitConflicts++;

                continue;
            }

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

            for (
                const room of compatibleRooms
            ) {

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

                console.log(
                    "DOUBLE SLOT FOUND",
                    {
                        taskId:
                            task.taskId,

                        firstPeriod:
                            firstPeriod,

                        secondPeriod:
                            secondPeriod,

                        room:
                            room
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
// GENERATE TIMETABLE
// ============================================================

// ============================================================
// GENERATE TIMETABLE
// ============================================================

async function generateTimetable() {

    console.log(
        "======================================"
    );

    console.log(
        "GENERATE TIMETABLE FUNCTION STARTED"
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


    if (
        timetableGenerationRunning
    ) {

        console.warn(
            "TIMETABLE GENERATION ALREADY RUNNING"
        );

        return;
    }


    if (
        !timetableState.schoolId
    ) {

        console.error(
            "NO SCHOOL SELECTED"
        );

        alert(
            "Please select a school first."
        );

        return;
    }


    timetableGenerationRunning =
        true;


    try {

        console.log(
            "STARTING TIMETABLE DATA LOAD..."
        );

        setTimetableGenerationStatus(
            "Loading timetable data...",
            "info"
        );
    // --------------------------------------------------------
    // CHECK SCHOOL
    // --------------------------------------------------------

    if (
        !timetableState.schoolId
    ) {

        alert(
            "Please select a school first."
        );

        return;

    }


    timetableGenerationRunning =
        true;


    try {

        setTimetableGenerationStatus(
            "Loading timetable data...",
            "info"
        );


        // ----------------------------------------------------
        // LOAD DATA
        // ----------------------------------------------------

        const data =
            await loadTimetableGeneratorData();


        validateTimetableGeneratorData(
            data
        );


        // ----------------------------------------------------
        // LOOKUPS
        // ----------------------------------------------------

        const lookup =
            buildTimetableLookupMaps(
                data
            );


        // ----------------------------------------------------
        // TEACHING PERIODS
        // ----------------------------------------------------

        const teachingPeriods =
            getTeachingPeriods(
                data.periods
            );


console.log(
    "TOTAL PERIODS:",
    data.periods.length
);

console.log(
    "TEACHING PERIODS:",
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


        
        if (
            teachingPeriods.length === 0
        ) {

            throw new Error(
                "No teaching periods are available."
            );

        }


        // ----------------------------------------------------
        // CREATE TASKS
        // ----------------------------------------------------

        let tasks =
            createLessonTasks(
                data.requirements,
                lookup
            );


        if (
            tasks.length === 0
        ) {

            throw new Error(
                "No lessons could be generated from the requirements."
            );

        }


        // ----------------------------------------------------
        // RANDOMIZE SINGLE LESSON ORDER
        // ----------------------------------------------------

        tasks =
            shuffleArray(
                tasks
            );


        // ----------------------------------------------------
        // DOUBLE LESSONS FIRST
        // ----------------------------------------------------

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
            "Total lesson tasks:",
            tasks.length
        );


        setTimetableGenerationStatus(
            `Generating ${tasks.length} lessons...`,
            "info"
        );


        // ----------------------------------------------------
        // INDEXES
        // ----------------------------------------------------

        const indexes =
            createOccupancyIndexes();


        // ----------------------------------------------------
        // GENERATED ENTRIES
        // ----------------------------------------------------

        const entries = [];


        // ----------------------------------------------------
        // CONFLICTS
        // ----------------------------------------------------

        const conflicts = [];


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


            // ------------------------------------------------
            // DOUBLE LESSON
            // ------------------------------------------------

            if (
                task.isDouble
            ) {

                const doubleSlot =
                    findDoubleLessonSlot(
                        task,
                        teachingPeriods,
                        data.rooms,
                        indexes
                    );


                if (
                    !doubleSlot
                ) {

                    conflicts.push({

                        task,

                        reason:
                            "Could not find two consecutive free periods for this double lesson."

                    });


                    continue;

                }


                // ------------------------------------------------
                // RESERVE FIRST PERIOD
                // ------------------------------------------------

                reserveSlot(
                    task,
                    doubleSlot.firstPeriod,
                    doubleSlot.room,
                    indexes
                );


                // ------------------------------------------------
                // RESERVE SECOND PERIOD
                // ------------------------------------------------

                reserveSlot(
                    task,
                    doubleSlot.secondPeriod,
                    doubleSlot.room,
                    indexes
                );


                // ------------------------------------------------
                // CREATE TWO ENTRIES
                // ------------------------------------------------

                entries.push(

                    createGeneratedEntry(
                        task,
                        doubleSlot.firstPeriod,
                        doubleSlot.room
                    )

                );


                entries.push(

                    createGeneratedEntry(
                        task,
                        doubleSlot.secondPeriod,
                        doubleSlot.room
                    )

                );

            }


            // ------------------------------------------------
            // SINGLE LESSON
            // ------------------------------------------------

            else {

                const slot =
                    findSingleLessonSlot(
                        task,
                        teachingPeriods,
                        data.rooms,
                        indexes
                    );


                if (
                    !slot
                ) {

                    conflicts.push({

                        task,

                        reason:
                            "Could not find a free period, teacher slot or room."

                    });


                    continue;

                }


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

            }


            // ------------------------------------------------
            // STATUS UPDATE
            // ------------------------------------------------

            if (
                i % 10 === 0 ||
                i === tasks.length - 1
            ) {

                setTimetableGenerationStatus(

                    `Generating timetable... ${i + 1} / ${tasks.length}`,

                    "info"

                );

            }

        }


        // ====================================================
        // CHECK RESULTS
        // ====================================================

        console.log(
            "Generated entries:",
            entries.length
        );


        console.log(
            "Generation conflicts:",
            conflicts.length
        );


        // ----------------------------------------------------
        // If nothing was generated
        // ----------------------------------------------------

        if (
            entries.length === 0
        ) {

            showTimetableConflicts(
                conflicts,
                lookup
            );


            throw new Error(
                "No timetable entries could be generated."
            );

        }


        // ====================================================
        // DELETE OLD TIMETABLE
        // ====================================================

        setTimetableGenerationStatus(
            "Clearing previous generated timetable...",
            "info"
        );


        const {
            error:
                deleteError
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

            throw new Error(
                "Failed to clear previous timetable: " +
                deleteError.message
            );

        }


        // ====================================================
        // INSERT NEW TIMETABLE
        // ====================================================

        setTimetableGenerationStatus(
            `Saving ${entries.length} timetable entries...`,
            "info"
        );


        const {
            data:
                insertedEntries,

            error:
                insertError

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

            throw new Error(
                "Failed to save generated timetable: " +
                insertError.message
            );

        }


        generatedTimetableEntries =
            insertedEntries || entries;


        // ====================================================
        // SHOW CONFLICTS
        // ====================================================

        showTimetableConflicts(
            conflicts,
            lookup
        );


        // ====================================================
        // LOAD FILTERS
        // ====================================================

        await loadTimetableFilters(
            data
        );


        // ====================================================
        // DISPLAY TIMETABLE
        // ====================================================

        await loadGeneratedTimetable();


        // ====================================================
        // SUMMARY
        // ====================================================

        showTimetableSummary(

            tasks.length,

            entries.length,

            conflicts.length

        );


        // ====================================================
        // SUCCESS MESSAGE
        // ====================================================

        if (
            conflicts.length === 0
        ) {

            setTimetableGenerationStatus(

                `Timetable generated successfully. ${entries.length} lesson periods created.`,

                "success"

            );

        }

        else {

            setTimetableGenerationStatus(

                `Timetable generated with ${conflicts.length} unresolved lesson(s). ${entries.length} lesson periods were created.`,

                "warning"

            );

        }


    }

    catch (error) {

        console.error(
            "TIMETABLE GENERATION ERROR:",
            error
        );


        setTimetableGenerationStatus(

            "Timetable generation failed: " +
            error.message,

            "error"

        );


        alert(
            "Timetable generation failed:\n\n" +
            error.message
        );

    }

    finally {

        timetableGenerationRunning =
            false;

    }

}


// ============================================================
// LOAD GENERATED TIMETABLE
// ============================================================

async function loadGeneratedTimetable() {

    const container =
        document.getElementById(
            "timetableContent"
        );


    if (!container) {
        return;
    }


    if (
        !timetableState.schoolId
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div>📅</div>

                <h3>
                    Please select a school
                </h3>

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="loading-message">

            Loading generated timetable...

        </div>

    `;


    // --------------------------------------------------------
    // LOAD ENTRIES
    // --------------------------------------------------------

    const {
        data,
        error
    } = await supabaseClient

        .from(
            "timetable_entries"
        )

        .select("*")

        .eq(
            "school_id",
            timetableState.schoolId
        );


    if (
        error
    ) {

        console.error(
            "Failed to load timetable entries:",
            error
        );


        container.innerHTML = `

            <div class="empty-message">

                Failed to load timetable.

                <br><br>

                ${escapeHtml(
                    error.message
                )}

            </div>

        `;

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

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

        generatedTimetableEntries =
            [];

        return;

    }


    // --------------------------------------------------------
    // LOAD SUPPORTING DATA
    // --------------------------------------------------------

    const [

        periodsResult,

        streamsResult,

        subjectsResult,

        teachersResult,

        roomsResult

    ] = await Promise.all([

        supabaseClient

            .from(
                "timetable_periods"
            )

            .select("*")

            .eq(
                "school_id",
                timetableState.schoolId
            ),


        supabaseClient

            .from(
                "timetable_streams"
            )

            .select("*")

            .eq(
                "school_id",
                timetableState.schoolId
            ),


        supabaseClient

            .from(
                "timetable_subjects"
            )

            .select("*")

            .eq(
                "school_id",
                timetableState.schoolId
            ),


        supabaseClient

            .from(
                "timetable_teachers"
            )

            .select("*")

            .eq(
                "school_id",
                timetableState.schoolId
            ),


        supabaseClient

            .from(
                "timetable_rooms"
            )

            .select("*")

            .eq(
                "school_id",
                timetableState.schoolId
            )

    ]);


    if (
        periodsResult.error ||
        streamsResult.error ||
        subjectsResult.error ||
        teachersResult.error ||
        roomsResult.error
    ) {

        console.error(
            "Failed to load timetable display data."
        );


        container.innerHTML = `

            <div class="empty-message">

                Failed to load timetable supporting data.

            </div>

        `;

        return;

    }


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


    generatedTimetableEntries =
        data;


    renderGeneratedTimetable(
        data,
        lookup
    );

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
                    No timetable generated yet
                </h3>

            </div>

        `;

        return;

    }


    // --------------------------------------------------------
    // FILTERS
    // --------------------------------------------------------

    const selectedStream =
        timetableStreamFilter
            ? timetableStreamFilter.value
            : "";


    const selectedDay =
        timetableDayFilter
            ? timetableDayFilter.value
            : "";


    const viewMode =
        timetableViewMode
            ? timetableViewMode.value
            : "stream";


    let filteredEntries =
        entries.filter(
            entry => {

                if (
                    selectedStream &&
                    entry.stream_id !==
                    selectedStream
                ) {

                    return false;

                }


                const period =
                    lookup.periods.get(
                        entry.period_id
                    );


                if (
                    selectedDay &&
                    period &&
                    period.day_name !==
                    selectedDay
                ) {

                    return false;

                }


                return true;

            }
        );


    // --------------------------------------------------------
    // SORT BY DAY / PERIOD
    // --------------------------------------------------------

    filteredEntries.sort(
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


    if (
        filteredEntries.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-message">

                No timetable entries match the selected filters.

            </div>

        `;

        return;

    }


    // --------------------------------------------------------
    // VIEW BY STREAM
    // --------------------------------------------------------

    if (
        viewMode === "stream"
    ) {

        renderTimetableByStream(
            filteredEntries,
            lookup,
            container
        );

        return;

    }


    // --------------------------------------------------------
    // VIEW BY TEACHER
    // --------------------------------------------------------

    if (
        viewMode === "teacher"
    ) {

        renderTimetableByTeacher(
            filteredEntries,
            lookup,
            container
        );

        return;

    }


    // --------------------------------------------------------
    // VIEW BY ROOM
    // --------------------------------------------------------

    if (
        viewMode === "room"
    ) {

        renderTimetableByRoom(
            filteredEntries,
            lookup,
            container
        );

        return;

    }

}


// ============================================================
// RENDER BY STREAM
// ============================================================

function renderTimetableByStream(
    entries,
    lookup,
    container
) {

    const streamMap =
        new Map();


    entries.forEach(
        entry => {

            if (
                !streamMap.has(
                    entry.stream_id
                )
            ) {

                streamMap.set(
                    entry.stream_id,
                    []
                );

            }


            streamMap.get(
                entry.stream_id
            ).push(
                entry
            );

        }
    );


    let html = "";


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


            html += `

                <div class="timetable-stream-block">

                    <h3>
                        🏫 ${escapeHtml(
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
                        lookup.teachers.get(
                            entry.teacher_id
                        );


                    const room =
                        lookup.rooms.get(
                            entry.room_id
                        );


                    html += `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    period?.day_name ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(
                                        period?.period_number ||
                                        "-"
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    formatPeriodTime(
                                        period
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

    const teacherMap =
        new Map();


    entries.forEach(
        entry => {

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


            teacherMap.get(
                teacherId
            ).push(
                entry
            );

        }
    );


    let html = "";


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


            html += `

                <div class="timetable-stream-block">

                    <h3>
                        👨‍🏫 ${escapeHtml(
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
                        lookup.rooms.get(
                            entry.room_id
                        );


                    html += `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    period?.day_name ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(
                                        period?.period_number ||
                                        "-"
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    formatPeriodTime(
                                        period
                                    )
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

}


// ============================================================
// RENDER BY ROOM
// ============================================================

function renderTimetableByRoom(
    entries,
    lookup,
    container
) {

    const roomMap =
        new Map();


    entries.forEach(
        entry => {

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


            roomMap.get(
                roomId
            ).push(
                entry
            );

        }
    );


    let html = "";


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


            html += `

                <div class="timetable-stream-block">

                    <h3>
                        🚪 ${escapeHtml(
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
                        lookup.teachers.get(
                            entry.teacher_id
                        );


                    html += `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    period?.day_name ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    String(
                                        period?.period_number ||
                                        "-"
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    formatPeriodTime(
                                        period
                                    )
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

}


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

        if (!data) {

            data =
                await loadTimetableGeneratorData();

        }


        // ----------------------------------------------------
        // STREAM FILTER
        // ----------------------------------------------------

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
                [
                    ...data.streams
                ].sort(
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


            streams.forEach(
                stream => {

                    html += `

                        <option
                            value="${escapeHtml(
                                stream.id
                            )}">

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


            if (
                currentValue &&
                data.streams.some(
                    stream =>
                        stream.id ===
                        currentValue
                )
            ) {

                timetableStreamFilter.value =
                    currentValue;

            }

        }

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

        return;

    }


    summary.style.display =
        "block";


    content.innerHTML = `

        <div class="summary-item">

            <strong>
                Requirements
            </strong>

            <span>
                ${totalTasks}
            </span>

        </div>


        <div class="summary-item">

            <strong>
                Generated Periods
            </strong>

            <span>
                ${generatedEntries}
            </span>

        </div>


        <div class="summary-item">

            <strong>
                Conflicts
            </strong>

            <span>
                ${conflictCount}
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

        return;

    }


    if (
        !conflicts ||
        conflicts.length === 0
    ) {

        container.style.display =
            "none";


        content.innerHTML =
            "";

        return;

    }


    container.style.display =
        "block";


    let html = `

        <div class="empty-message">

            <strong>
                ${conflicts.length}
                lesson task(s) could not be placed.
            </strong>

        </div>


        <table class="data-table">

            <thead>

                <tr>

                    <th>Stream</th>

                    <th>Subject</th>

                    <th>Teacher</th>

                    <th>Required Lessons</th>

                    <th>Reason</th>

                </tr>

            </thead>

            <tbody>

    `;


    conflicts.forEach(
        conflict => {

            const task =
                conflict.task;


            const stream =
                lookup.streams.get(
                    task.streamId
                );


            const subject =
                lookup.subjects.get(
                    task.subjectId
                );


            const teacher =
                lookup.teachers.get(
                    task.teacherId
                );


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
                        ${
                            task.isDouble
                                ? "Double"
                                : "Single"
                        }
                    </td>

                    <td>
                        ${escapeHtml(
                            conflict.reason
                        )}
                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


    content.innerHTML =
        html;

}


// ============================================================
// CLEAR TIMETABLE
// ============================================================

async function clearGeneratedTimetable() {

    if (
        !timetableState.schoolId
    ) {

        alert(
            "Please select a school first."
        );

        return;

    }


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

        setTimetableGenerationStatus(
            "Clearing timetable...",
            "info"
        );


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

            throw error;

        }


        generatedTimetableEntries =
            [];


        const summary =
            document.getElementById(
                "timetableSummary"
            );


        if (summary) {

            summary.style.display =
                "none";

        }


        const conflicts =
            document.getElementById(
                "timetableConflicts"
            );


        if (conflicts) {

            conflicts.style.display =
                "none";

        }


        await loadGeneratedTimetable();


        setTimetableGenerationStatus(
            "Timetable cleared successfully.",
            "success"
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


        alert(
            "Failed to clear timetable:\n\n" +
            error.message
        );

    }

}


// ============================================================
// REGENERATE TIMETABLE
// ============================================================

async function regenerateTimetable() {

    const confirmed =
        confirm(
            "Regenerate the timetable? The current generated timetable will be replaced."
        );


    if (
        !confirmed
    ) {

        return;

    }


    await generateTimetable();

}


// ============================================================
// PRINT TIMETABLE
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


    if (
        !printWindow
    ) {

        alert(
            "Please allow pop-ups to print the timetable."
        );

        return;

    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                School Timetable
            </title>

            <meta
                charset="UTF-8"
            >

            <style>

                body {

                    font-family:
                        Arial,
                        sans-serif;

                    padding:
                        20px;

                    color:
                        #000;

                }


                h1,
                h2,
                h3 {

                    margin-bottom:
                        10px;

                }


                table {

                    width:
                        100%;

                    border-collapse:
                        collapse;

                    margin-bottom:
                        25px;

                }


                th,
                td {

                    border:
                        1px solid #333;

                    padding:
                        8px;

                    text-align:
                        left;

                }


                th {

                    font-weight:
                        bold;

                }


                .timetable-stream-block {

                    margin-bottom:
                        30px;

                    page-break-inside:
                        avoid;

                }


                @media print {

                    body {

                        padding:
                            10px;

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

        console.log(
            "🚀 GENERATE TIMETABLE BUTTON CLICKED"
        );

        console.log(
            "School ID:",
            timetableState.schoolId
        );

        event.preventDefault();
        event.stopPropagation();

        try {

            await generateTimetable();

        }
        catch (error) {

            console.error(
                "GENERATE TIMETABLE CLICK ERROR:",
                error
            );

            setTimetableGenerationStatus(
                "Generation failed: " +
                error.message,
                "error"
            );

        }

    }
);
// ============================================================
// EVENT: REGENERATE TIMETABLE
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

        console.log(
            "REGENERATE TIMETABLE BUTTON CLICKED"
        );

        await regenerateTimetable();

    }
);


// ============================================================
// EVENT: CLEAR
// ============================================================

// ============================================================
// EVENT: CLEAR TIMETABLE
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

        console.log(
            "CLEAR TIMETABLE BUTTON CLICKED"
        );

        await clearGeneratedTimetable();

    }
);
// ============================================================
// EVENT: PRINT
// ============================================================

// ============================================================
// EVENT: PRINT TIMETABLE
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

        console.log(
            "PRINT TIMETABLE BUTTON CLICKED"
        );

        printGeneratedTimetable();

    }
);

// ============================================================
// EVENT: STREAM FILTER
// ============================================================

if (
    timetableStreamFilter
) {

    timetableStreamFilter.addEventListener(
        "change",
        async function () {

            await loadGeneratedTimetable();

        }
    );

}


// ============================================================
// EVENT: DAY FILTER
// ============================================================

if (
    timetableDayFilter
) {

    timetableDayFilter.addEventListener(
        "change",
        async function () {

            await loadGeneratedTimetable();

        }
    );

}


// ============================================================
// EVENT: VIEW MODE
// ============================================================

if (
    timetableViewMode
) {

    timetableViewMode.addEventListener(
        "change",
        async function () {

            await loadGeneratedTimetable();

        }
    );

}


async function initializeTimetableGenerator() {

    if (
        !timetableState.schoolId
    ) {

        return;

    }


    try {

        await loadTimetableFilters();


        await loadGeneratedTimetable();

    }

    catch (error) {

        console.error(
            "Timetable generator initialization error:",
            error
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

window.printGeneratedTimetable =
    printGeneratedTimetable;

window.initializeTimetableGenerator =
    initializeTimetableGenerator;




// ============================================================
// GENERATOR READY
// ============================================================

console.log(
    "======================================"
);

console.log(
    "TIMETABLE GENERATOR READY"
);

console.log(
    "======================================"
);

