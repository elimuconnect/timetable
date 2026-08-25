
// ============================================================
// 1. SUPABASE CONFIGURATION
// ============================================================

const SUPABASE_URL =
    "https://zcmzuetusvpmvubbjlmx.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_-BGJLAySaH7bQ5lBIZF9zg_eohK-xEn";

// Create Supabase client
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log(
    "Smart Timetable connected to Supabase:",
    SUPABASE_URL
);

// ============================================================
// 2. GLOBAL STATE
// ============================================================

const timetableState = {

    schoolId: null,

    schoolName: null,

    academicYear:
        new Date().getFullYear(),

    term: "1"

};

// ============================================================
// 3. NAVIGATION
// ============================================================

document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const sectionName =
                    button.dataset.section;

                if (!sectionName) {
                    return;
                }

                // Hide all sections

                document
                    .querySelectorAll(".section")
                    .forEach(section => {

                        section.classList.remove(
                            "active"
                        );

                    });

                // Remove active navigation

                document
                    .querySelectorAll(".nav-btn")
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                    });

                // Show selected section

                const target =
                    document.getElementById(
                        sectionName
                    );

                if (target) {

                    target.classList.add(
                        "active"
                    );

                }

                // Activate button

                button.classList.add(
                    "active"
                );

            }
        );

    });

// ============================================================
// 4. LOAD TIMETABLE SCHOOLS
// ============================================================

async function loadSchools() {

    console.log(
        "Loading timetable schools..."
    );

    const {
        data,
        error
    } = await supabaseClient

        .from("timetable_schools")

        .select(
            "id, name, status"
        )

        .order(
            "name",
            {
                ascending: true
            }
        );

    console.log(
        "Timetable schools response:",
        {
            data,
            error
        }
    );

    if (error) {

        console.error(
            "ERROR LOADING TIMETABLE SCHOOLS:",
            error
        );

        showDatabaseError(
            "timetable_schools",
            error
        );

        return;

    }

    const select =
        document.getElementById(
            "schoolSelect"
        );

    if (!select) {

        console.error(
            "schoolSelect element was not found."
        );

        return;

    }

    select.innerHTML = `
        <option value="">
            Select school
        </option>
    `;

    if (!data || data.length === 0) {

        select.innerHTML = `
            <option value="">
                No schools found
            </option>
        `;

        console.warn(
            "No timetable schools were returned from Supabase."
        );

        return;

    }

    data.forEach(
        school => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                school.id;

            option.textContent =
                school.name;

            select.appendChild(
                option
            );

        }
    );

    console.log(
        `Loaded ${data.length} timetable schools.`
    );

}

// ============================================================
// 5. SCHOOL SELECTION
// ============================================================

const schoolSelect =
    document.getElementById(
        "schoolSelect"
    );

if (schoolSelect) {

    schoolSelect.addEventListener(
        "change",
        async function () {

            const schoolId =
                this.value;

            // ------------------------------------------------
            // NO SCHOOL SELECTED
            // ------------------------------------------------

            if (!schoolId) {

                timetableState.schoolId =
                    null;

                timetableState.schoolName =
                    null;

                const schoolNameElement =
                    document.getElementById(
                        "schoolName"
                    );

                if (schoolNameElement) {

                    schoolNameElement.textContent =
                        "No school selected";

                }

                resetDashboardCounts();

                return;

            }

            // ------------------------------------------------
            // GET SELECTED SCHOOL
            // ------------------------------------------------

            const selectedOption =
                this.options[
                    this.selectedIndex
                ];

            const schoolName =
                selectedOption.textContent;

            // ------------------------------------------------
            // UPDATE GLOBAL STATE
            // ------------------------------------------------

            timetableState.schoolId =
                schoolId;

            timetableState.schoolName =
                schoolName;

            const schoolNameElement =
                document.getElementById(
                    "schoolName"
                );

            if (schoolNameElement) {

                schoolNameElement.textContent =
                    schoolName;

            }

            console.log(
                "Selected timetable school:",
                schoolName
            );

            console.log(
                "Selected school ID:",
                schoolId
            );

            // ------------------------------------------------
            // LOAD DASHBOARD DATA
            // ------------------------------------------------

            await loadDashboardData(
                schoolId
            );

            // ------------------------------------------------
            // LOAD TIMETABLE GENERATOR
            // ------------------------------------------------

            if (
                typeof initializeTimetableGenerator ===
                "function"
            ) {

                await initializeTimetableGenerator();

            }

        }
    );

}

// ============================================================
// 6. LOAD DASHBOARD DATA
// ============================================================

async function loadDashboardData(
    schoolId
) {

    console.log(
        "======================================"
    );

    console.log(
        "LOADING DASHBOARD DATA"
    );

    console.log(
        "School ID:",
        schoolId
    );

    console.log(
        "======================================"
    );

    // --------------------------------------------------------
    // TEACHERS
    // --------------------------------------------------------

    await loadTableCount(
        "timetable_teachers",
        "teacherCount",
        schoolId,
        "teacher_name"
    );

    // --------------------------------------------------------
    // SUBJECTS
    // --------------------------------------------------------

    await loadTableCount(
        "timetable_subjects",
        "subjectCount",
        schoolId,
        "subject_name"
    );

    // --------------------------------------------------------
    // STREAMS
    // --------------------------------------------------------

    await loadTableCount(
        "timetable_streams",
        "streamCount",
        schoolId,
        "stream_name"
    );

    // --------------------------------------------------------
    // ROOMS
    // --------------------------------------------------------

    await loadTableCount(
        "timetable_rooms",
        "roomCount",
        schoolId,
        "room_name"
    );

    console.log(
        "======================================"
    );

    console.log(
        "DASHBOARD LOADING COMPLETE"
    );

    console.log(
        "======================================"
    );

}

// ============================================================
// 7. LOAD INDIVIDUAL TABLE COUNT
// ============================================================

async function loadTableCount(
    tableName,
    elementId,
    schoolId,
    displayColumn
) {

    console.log(
        `Loading ${tableName}...`
    );

    const {
        data,
        error
    } = await supabaseClient

        .from(tableName)

        .select(
            `id, school_id, ${displayColumn}`
        );

    console.log(
        `${tableName} response:`,
        {
            data,
            error
        }
    );

    // --------------------------------------------------------
    // ERROR
    // --------------------------------------------------------

    if (error) {

        console.error(
            `ERROR loading ${tableName}:`,
            error
        );

        const element =
            document.getElementById(
                elementId
            );

        if (element) {

            element.textContent =
                "ERR";

        }

        showDatabaseError(
            tableName,
            error
        );

        return;

    }

    // --------------------------------------------------------
    // NO DATA
    // --------------------------------------------------------

    if (!data) {

        const element =
            document.getElementById(
                elementId
            );

        if (element) {

            element.textContent =
                "0";

        }

        console.warn(
            `${tableName}: Supabase returned no data.`
        );

        return;

    }

    // --------------------------------------------------------
    // FILTER BY SCHOOL
    // --------------------------------------------------------

    const schoolRows =
        data.filter(
            row =>
                String(row.school_id)
                ===
                String(schoolId)
        );

    console.log(
        `${tableName}:`,
        "Total rows =",
        data.length,
        "Selected school rows =",
        schoolRows.length
    );

    // --------------------------------------------------------
    // DISPLAY COUNT
    // --------------------------------------------------------

    const element =
        document.getElementById(
            elementId
        );

    if (element) {

        element.textContent =
            schoolRows.length;

    }

}

// ============================================================
// 8. RESET DASHBOARD COUNTS
// ============================================================

function resetDashboardCounts() {

    const counts = [
        "teacherCount",
        "subjectCount",
        "streamCount",
        "roomCount"
    ];

    counts.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );

            if (element) {

                element.textContent =
                    "0";

            }

        }
    );

}

// ============================================================
// 9. DATABASE ERROR DISPLAY
// ============================================================

function showDatabaseError(
    tableName,
    error
) {

    console.error(
        "--------------------------------------"
    );

    console.error(
        "DATABASE ERROR"
    );

    console.error(
        "Table:",
        tableName
    );

    console.error(
        "Message:",
        error?.message
    );

    console.error(
        "Code:",
        error?.code
    );

    console.error(
        "Details:",
        error?.details
    );

    console.error(
        "Hint:",
        error?.hint
    );

    console.error(
        "--------------------------------------"
    );

}

// ============================================================
// 10. ACADEMIC YEAR
// ============================================================

const academicYearInput =
    document.getElementById(
        "academicYear"
    );

if (academicYearInput) {

    academicYearInput.addEventListener(
        "change",
        function () {

            timetableState.academicYear =
                this.value;

            console.log(
                "Academic year:",
                this.value
            );

        }
    );

}

// ============================================================
// 11. TERM
// ============================================================

const termSelect =
    document.getElementById(
        "term"
    );

if (termSelect) {

    termSelect.addEventListener(
        "change",
        function () {

            timetableState.term =
                this.value;

            console.log(
                "Selected term:",
                this.value
            );

        }
    );

}

// ============================================================
// 12. AUTOMATIC TIMETABLE GENERATOR
// ============================================================
//
// IMPORTANT:
// The actual generator is now in:
//
// appgen.js
//
// Do NOT put the large generator here.
//
// appgen.js is loaded after app.js.
// ============================================================

// ============================================================
// 13. INITIALIZE APPLICATION
// ============================================================

async function initializeApp() {

    console.log(
        "======================================"
    );

    console.log(
        "SMART TIMETABLE STARTING"
    );

    console.log(
        "======================================"
    );

    try {

        await loadSchools();

        console.log(
            "Application initialized successfully."
        );

    } catch (error) {

        console.error(
            "APPLICATION INITIALIZATION ERROR:",
            error
        );

    }

}

// ============================================================
// START APPLICATION
// ============================================================

initializeApp();



// ============================================================
// 15. TEACHER MANAGEMENT
// ============================================================


// ------------------------------------------------------------
// OPEN ADD TEACHER FORM
// ------------------------------------------------------------

const addTeacherBtn =
    document.getElementById(
        "addTeacherBtn"
    );


if (addTeacherBtn) {

    addTeacherBtn.addEventListener(
        "click",
        () => {

            if (!timetableState.schoolId) {

                alert(
                    "Please select a school first."
                );

                return;

            }


            openTeacherForm();

        }
    );

}


// ------------------------------------------------------------
// OPEN TEACHER FORM
// ------------------------------------------------------------

function openTeacherForm(
    teacher = null
) {

    const form =
        document.getElementById(
            "teacherFormCard"
        );


    if (!form) return;


    form.style.display =
        "block";


    if (teacher) {

        document.getElementById(
            "teacherFormTitle"
        ).textContent =
            "Edit Teacher";


        document.getElementById(
            "teacherId"
        ).value =
            teacher.id;


        document.getElementById(
            "teacherName"
        ).value =
            teacher.teacher_name || "";


        document.getElementById(
            "teacherCode"
        ).value =
            teacher.teacher_code || "";


        document.getElementById(
            "maxLessonsDay"
        ).value =
            teacher.max_lessons_per_day || 6;


        document.getElementById(
            "maxLessonsWeek"
        ).value =
            teacher.max_lessons_per_week || 30;


        document.getElementById(
            "maxConsecutive"
        ).value =
            teacher.max_consecutive_lessons || 2;

    } else {

        document.getElementById(
            "teacherFormTitle"
        ).textContent =
            "Add Teacher";


        document.getElementById(
            "teacherId"
        ).value =
            "";


        document.getElementById(
            "teacherName"
        ).value =
            "";


        document.getElementById(
            "teacherCode"
        ).value =
            "";


        document.getElementById(
            "maxLessonsDay"
        ).value =
            6;


        document.getElementById(
            "maxLessonsWeek"
        ).value =
            30;


        document.getElementById(
            "maxConsecutive"
        ).value =
            2;

    }


    form.scrollIntoView({
        behavior: "smooth"
    });

}


// ------------------------------------------------------------
// CANCEL TEACHER FORM
// ------------------------------------------------------------

const cancelTeacherBtn =
    document.getElementById(
        "cancelTeacherBtn"
    );


if (cancelTeacherBtn) {

    cancelTeacherBtn.addEventListener(
        "click",
        () => {

            closeTeacherForm();

        }
    );

}


function closeTeacherForm() {

    const form =
        document.getElementById(
            "teacherFormCard"
        );


    if (form) {

        form.style.display =
            "none";

    }

}


// ------------------------------------------------------------
// SAVE TEACHER
// ------------------------------------------------------------

const saveTeacherBtn =
    document.getElementById(
        "saveTeacherBtn"
    );


if (saveTeacherBtn) {

    saveTeacherBtn.addEventListener(
        "click",
        saveTeacher
    );

}


async function saveTeacher() {

    // -----------------------------------------
    // CHECK SCHOOL
    // -----------------------------------------

    if (!timetableState.schoolId) {

        alert(
            "Please select a school first."
        );

        return;

    }


    // -----------------------------------------
    // GET FORM VALUES
    // -----------------------------------------

    const teacherId =
        document.getElementById(
            "teacherId"
        ).value.trim();


    const teacherName =
        document.getElementById(
            "teacherName"
        ).value.trim();


    const teacherCode =
        document.getElementById(
            "teacherCode"
        ).value.trim();


    const maxLessonsDay =
        Number(
            document.getElementById(
                "maxLessonsDay"
            ).value
        );


    const maxLessonsWeek =
        Number(
            document.getElementById(
                "maxLessonsWeek"
            ).value
        );


    const maxConsecutive =
        Number(
            document.getElementById(
                "maxConsecutive"
            ).value
        );


    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!teacherName) {

        alert(
            "Please enter the teacher's name."
        );

        return;

    }


    if (!teacherCode) {

        alert(
            "Please enter the teacher code."
        );

        return;

    }


    if (
        !maxLessonsDay ||
        maxLessonsDay < 1
    ) {

        alert(
            "Please enter a valid maximum lessons per day."
        );

        return;

    }


    if (
        !maxLessonsWeek ||
        maxLessonsWeek < 1
    ) {

        alert(
            "Please enter a valid maximum lessons per week."
        );

        return;

    }


    if (
        !maxConsecutive ||
        maxConsecutive < 1
    ) {

        alert(
            "Please enter a valid maximum consecutive lessons."
        );

        return;

    }


    // -----------------------------------------
    // PREPARE DATA
    // -----------------------------------------

    const teacherData = {

        school_id:
            timetableState.schoolId,

        teacher_name:
            teacherName,

        teacher_code:
            teacherCode,

        max_lessons_per_day:
            maxLessonsDay,

        max_lessons_per_week:
            maxLessonsWeek,

        max_consecutive_lessons:
            maxConsecutive

    };


    let result;


    // -----------------------------------------
    // UPDATE
    // -----------------------------------------

    if (teacherId) {

        result =
            await supabaseClient

                .from(
                    "timetable_teachers"
                )

                .update(
                    teacherData
                )

                .eq(
                    "id",
                    teacherId
                )

                .eq(
                    "school_id",
                    timetableState.schoolId
                );

    }


    // -----------------------------------------
    // INSERT
    // -----------------------------------------

    else {

        result =
            await supabaseClient

                .from(
                    "timetable_teachers"
                )

                .insert(
                    teacherData
                );

    }


    // -----------------------------------------
    // ERROR
    // -----------------------------------------

    if (result.error) {

        console.error(
            "Teacher save error:",
            result.error
        );


        alert(
            "Failed to save teacher:\n\n" +
            result.error.message
        );


        return;

    }


    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

    alert(
        teacherId
            ? "Teacher updated successfully."
            : "Teacher added successfully."
    );


    closeTeacherForm();


    await loadTeachers();


    await loadDashboardData(
        timetableState.schoolId
    );

}


// ------------------------------------------------------------
// LOAD TEACHERS
// ------------------------------------------------------------

async function loadTeachers() {

    const container =
        document.getElementById(
            "teachersTableContainer"
        );


    if (!container) return;


    if (!timetableState.schoolId) {

        container.innerHTML =
            `
            <div class="empty-message">
                Please select a school first.
            </div>
            `;

        return;

    }


    container.innerHTML =
        `
        <div class="loading-message">
            Loading teachers...
        </div>
        `;


    const {
        data,
        error
    } = await supabaseClient

        .from(
            "timetable_teachers"
        )

        .select("*")

        .eq(
            "school_id",
            timetableState.schoolId
        )

        .order(
            "teacher_name"
        );


    if (error) {

        console.error(
            "Failed to load teachers:",
            error
        );


        container.innerHTML =
            `
            <div class="empty-message">
                Failed to load teachers.
            </div>
            `;

        return;

    }


    if (!data || data.length === 0) {

        container.innerHTML =
            `
            <div class="empty-message">

                No teachers have been added
                for this school yet.

            </div>
            `;

        return;

    }


    let html = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>Teacher</th>

                    <th>Code</th>

                    <th>Max / Day</th>

                    <th>Max / Week</th>

                    <th>Max Consecutive</th>

                    <th>Actions</th>

                </tr>

            </thead>

            <tbody>
    `;


    data.forEach(
        teacher => {

            html += `

                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                teacher.teacher_name
                            )}
                        </strong>
                    </td>


                    <td>
                        ${escapeHtml(
                            teacher.teacher_code
                        )}
                    </td>


                    <td>
                        ${teacher.max_lessons_per_day}
                    </td>


                    <td>
                        ${teacher.max_lessons_per_week}
                    </td>


                    <td>
                        ${teacher.max_consecutive_lessons}
                    </td>


                    <td>

                        <button
                            class="action-btn edit-btn"
                            onclick='editTeacher(${JSON.stringify(
                                teacher
                            )})'>

                            Edit

                        </button>


                        <button
                            class="action-btn delete-btn"
                            onclick="deleteTeacher('${teacher.id}')">

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML =
        html;

}


// ------------------------------------------------------------
// EDIT TEACHER
// ------------------------------------------------------------

window.editTeacher =
    function (teacher) {

        openTeacherForm(
            teacher
        );

    };


// ------------------------------------------------------------
// DELETE TEACHER
// ------------------------------------------------------------

window.deleteTeacher =
    async function (teacherId) {

        if (!timetableState.schoolId) {

            alert(
                "Please select a school."
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to delete this teacher?"
            );


        if (!confirmed) {

            return;

        }


        const {
            error
        } = await supabaseClient

            .from(
                "timetable_teachers"
            )

            .delete()

            .eq(
                "id",
                teacherId
            )

            .eq(
                "school_id",
                timetableState.schoolId
            );


        if (error) {

            console.error(
                "Delete teacher error:",
                error
            );


            alert(
                "Failed to delete teacher:\n\n" +
                error.message
            );


            return;

        }


        alert(
            "Teacher deleted successfully."
        );


        await loadTeachers();


        await loadDashboardData(
            timetableState.schoolId
        );

    };


// ------------------------------------------------------------
// HTML ESCAPE
// ------------------------------------------------------------

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

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

if (schoolSelect) {

    schoolSelect.addEventListener(
        "change",
        async function () {

            if (
                timetableState.schoolId
            ) {

                await loadTeachers();

                await loadRequirementOptions();

                await loadRequirements();

            }

        }
    );

}

// ============================================================
// 16. SUBJECT MANAGEMENT
// ============================================================


// ------------------------------------------------------------
// OPEN ADD SUBJECT FORM
// ------------------------------------------------------------

const addSubjectBtn =
    document.getElementById("addSubjectBtn");

if (addSubjectBtn) {

    addSubjectBtn.addEventListener(
        "click",
        () => {

            if (!timetableState.schoolId) {

                alert("Please select a school first.");

                return;

            }

            openSubjectForm();

        }
    );

}


// ------------------------------------------------------------
// OPEN SUBJECT FORM
// ------------------------------------------------------------

function openSubjectForm(subject = null) {

    const form =
        document.getElementById("subjectFormCard");

    if (!form) return;

    form.style.display = "block";


    if (subject) {

        document.getElementById(
            "subjectFormTitle"
        ).textContent = "Edit Subject";

        document.getElementById(
            "subjectId"
        ).value = subject.id;

        document.getElementById(
            "subjectName"
        ).value =
            subject.subject_name || "";

        document.getElementById(
            "subjectCode"
        ).value =
            subject.subject_code || "";

        document.getElementById(
            "lessonsPerWeek"
        ).value =
            subject.lessons_per_week || 1;

        document.getElementById(
            "requiresDoubleLesson"
        ).checked =
            subject.requires_double_lesson === true;

        document.getElementById(
            "requiresRoom"
        ).checked =
            subject.requires_room === true;

        document.getElementById(
            "roomType"
        ).value =
            subject.room_type || "";

    } else {

        document.getElementById(
            "subjectFormTitle"
        ).textContent = "Add Subject";

        document.getElementById(
            "subjectId"
        ).value = "";

        document.getElementById(
            "subjectName"
        ).value = "";

        document.getElementById(
            "subjectCode"
        ).value = "";

        document.getElementById(
            "lessonsPerWeek"
        ).value = 1;

        document.getElementById(
            "requiresDoubleLesson"
        ).checked = false;

        document.getElementById(
            "requiresRoom"
        ).checked = false;

        document.getElementById(
            "roomType"
        ).value = "";

    }


    form.scrollIntoView({
        behavior: "smooth"
    });

}


// ------------------------------------------------------------
// CANCEL SUBJECT FORM
// ------------------------------------------------------------

const cancelSubjectBtn =
    document.getElementById("cancelSubjectBtn");

if (cancelSubjectBtn) {

    cancelSubjectBtn.addEventListener(
        "click",
        closeSubjectForm
    );

}


function closeSubjectForm() {

    const form =
        document.getElementById("subjectFormCard");

    if (form) {

        form.style.display = "none";

    }

}


// ------------------------------------------------------------
// SAVE SUBJECT
// ------------------------------------------------------------

const saveSubjectBtn =
    document.getElementById("saveSubjectBtn");

if (saveSubjectBtn) {

    saveSubjectBtn.addEventListener(
        "click",
        saveSubject
    );

}


async function saveSubject() {

    // -----------------------------------------
    // CHECK SCHOOL
    // -----------------------------------------

    if (!timetableState.schoolId) {

        alert("Please select a school first.");

        return;

    }


    // -----------------------------------------
    // GET FORM VALUES
    // -----------------------------------------

    const subjectId =
        document.getElementById(
            "subjectId"
        ).value.trim();


    const subjectName =
        document.getElementById(
            "subjectName"
        ).value.trim();


    const subjectCode =
        document.getElementById(
            "subjectCode"
        ).value.trim();


    const lessonsPerWeek =
        Number(
            document.getElementById(
                "lessonsPerWeek"
            ).value
        );


    const requiresDoubleLesson =
        document.getElementById(
            "requiresDoubleLesson"
        ).checked;


    const requiresRoom =
        document.getElementById(
            "requiresRoom"
        ).checked;


    const roomType =
        document.getElementById(
            "roomType"
        ).value.trim();


    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!subjectName) {

        alert("Please enter the subject name.");

        return;

    }


    if (!subjectCode) {

        alert("Please enter the subject code.");

        return;

    }


    if (
        !lessonsPerWeek ||
        lessonsPerWeek < 1
    ) {

        alert(
            "Please enter a valid number of lessons per week."
        );

        return;

    }


    if (requiresRoom && !roomType) {

        alert(
            "Please specify the required room type."
        );

        return;

    }


    // -----------------------------------------
    // PREPARE DATA
    // -----------------------------------------

    const subjectData = {

        school_id:
            timetableState.schoolId,

        subject_name:
            subjectName,

        subject_code:
            subjectCode,

        lessons_per_week:
            lessonsPerWeek,

        requires_double_lesson:
            requiresDoubleLesson,

        requires_room:
            requiresRoom,

        room_type:
            requiresRoom
                ? roomType
                : null

    };


    let result;


    // -----------------------------------------
    // UPDATE
    // -----------------------------------------

    if (subjectId) {

        result =
            await supabaseClient

                .from("timetable_subjects")

                .update(subjectData)

                .eq(
                    "id",
                    subjectId
                )

                .eq(
                    "school_id",
                    timetableState.schoolId
                );

    }


    // -----------------------------------------
    // INSERT
    // -----------------------------------------

    else {

        result =
            await supabaseClient

                .from("timetable_subjects")

                .insert(subjectData);

    }


    // -----------------------------------------
    // ERROR
    // -----------------------------------------

    if (result.error) {

        console.error(
            "Subject save error:",
            result.error
        );

        alert(
            "Failed to save subject:\n\n" +
            result.error.message
        );

        return;

    }


    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

    alert(
        subjectId
            ? "Subject updated successfully."
            : "Subject added successfully."
    );


    closeSubjectForm();


    await loadSubjects();


    await loadDashboardData(
        timetableState.schoolId
    );

}


// ------------------------------------------------------------
// LOAD SUBJECTS
// ------------------------------------------------------------

async function loadSubjects() {

    const container =
        document.getElementById(
            "subjectsTableContainer"
        );

    if (!container) return;


    if (!timetableState.schoolId) {

        container.innerHTML =
            `
            <div class="empty-message">
                Please select a school first.
            </div>
            `;

        return;

    }


    container.innerHTML =
        `
        <div class="loading-message">
            Loading subjects...
        </div>
        `;


    const {
        data,
        error
    } = await supabaseClient

        .from("timetable_subjects")

        .select("*")

        .eq(
            "school_id",
            timetableState.schoolId
        )

        .order(
            "subject_name"
        );


    if (error) {

        console.error(
            "Failed to load subjects:",
            error
        );

        container.innerHTML =
            `
            <div class="empty-message">
                Failed to load subjects.
            </div>
            `;

        return;

    }


    if (!data || data.length === 0) {

        container.innerHTML =
            `
            <div class="empty-message">
                No subjects have been added
                for this school yet.
            </div>
            `;

        return;

    }


    let html = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>Subject</th>

                    <th>Code</th>

                    <th>Lessons / Week</th>

                    <th>Double Lesson</th>

                    <th>Room Required</th>

                    <th>Room Type</th>

                    <th>Actions</th>

                </tr>

            </thead>

            <tbody>

    `;


    data.forEach(subject => {

        html += `

            <tr>

                <td>
                    <strong>
                        ${escapeHtml(
                            subject.subject_name
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(
                        subject.subject_code
                    )}
                </td>

                <td>
                    ${subject.lessons_per_week}
                </td>

                <td>
                    ${
                        subject.requires_double_lesson
                            ? "Yes"
                            : "No"
                    }
                </td>

                <td>
                    ${
                        subject.requires_room
                            ? "Yes"
                            : "No"
                    }
                </td>

                <td>
                    ${escapeHtml(
                        subject.room_type || "-"
                    )}
                </td>

                <td>

                    <button
                        class="action-btn edit-btn"
                        onclick='editSubject(${JSON.stringify(
                            subject
                        )})'>

                        Edit

                    </button>


                    <button
                        class="action-btn delete-btn"
                        onclick="deleteSubject('${subject.id}')">

                        Delete

                    </button>

                </td>

            </tr>

        `;

    });


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML = html;

}


// ------------------------------------------------------------
// EDIT SUBJECT
// ------------------------------------------------------------

window.editSubject =
    function(subject) {

        openSubjectForm(subject);

    };


// ------------------------------------------------------------
// DELETE SUBJECT
// ------------------------------------------------------------

window.deleteSubject =
    async function(subjectId) {

        if (!timetableState.schoolId) {

            alert(
                "Please select a school."
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to delete this subject?"
            );


        if (!confirmed) {

            return;

        }


        const {
            error
        } = await supabaseClient

            .from("timetable_subjects")

            .delete()

            .eq(
                "id",
                subjectId
            )

            .eq(
                "school_id",
                timetableState.schoolId
            );


        if (error) {

            console.error(
                "Delete subject error:",
                error
            );

            alert(
                "Failed to delete subject:\n\n" +
                error.message
            );

            return;

        }


        alert(
            "Subject deleted successfully."
        );


        await loadSubjects();


        await loadDashboardData(
            timetableState.schoolId
        );

    };


// ------------------------------------------------------------
// LOAD SUBJECTS WHEN SCHOOL CHANGES
// ------------------------------------------------------------

if (schoolSelect) {

    schoolSelect.addEventListener(
        "change",
        async function() {

            if (
                timetableState.schoolId
            ) {

                await loadSubjects();

            }

        }
    );

}

// ============================================================
// 17. ROOM MANAGEMENT
// ============================================================



// ============================================================
// ROOM MANAGEMENT
// GLOBAL ROOM TYPES + SCHOOL ROOMS
// ============================================================


// ============================================================
// ROOM TYPE CACHE
// ============================================================

let timetableRoomTypes = [];


// ============================================================
// LOAD GLOBAL ROOM TYPES
// ============================================================


// ============================================================
// LOAD GLOBAL ROOM TYPES
// ============================================================

async function loadRoomTypes() {

    const {
        data,
        error
    } = await supabaseClient

        .from("timetable_room_types")

        .select(`
            id,
            type_name
        `)

        .order(
            "type_name",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Failed to load global room types:",
            error
        );

        timetableRoomTypes = [];

        return false;
    }


    timetableRoomTypes =
        data || [];


    console.log(
        "GLOBAL ROOM TYPES LOADED:",
        timetableRoomTypes
    );


    return true;
}

// ============================================================
// POPULATE ROOM TYPE SELECT
// Used by ADD ROOM and EDIT ROOM
// ============================================================

function populateRoomTypeSelect(
    selectedId = ""
) {

    const select =
        document.getElementById(
            "roomTypeSelect"
        );


    if (!select) {

        console.warn(
            "roomTypeSelect not found."
        );

        return;
    }


    select.innerHTML = `
        <option value="">
            Select room type
        </option>
    `;


    timetableRoomTypes.forEach(
        type => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                type.id;


            option.textContent =
                type.type_name;


            if (
                String(type.id) ===
                String(selectedId)
            ) {

                option.selected = true;

            }


            select.appendChild(
                option
            );

        }
    );

}





// ============================================================
// GET ROOM TYPE NAME
// ============================================================

function getRoomTypeName(
    roomTypeId
) {

    if (!roomTypeId) {

        return "";

    }


    const type =
        timetableRoomTypes.find(
            item =>
                item.id ===
                roomTypeId
        );


    return type
        ? type.type_name
        : "";

}


// ============================================================
// FIND ROOM TYPE BY NAME
// ============================================================
//
// This is useful for older rooms that still have
// room_type text but room_type_id is NULL.
//

function findRoomTypeByName(
    roomTypeName
) {

    if (!roomTypeName) {

        return null;

    }


    const normalized =
        String(
            roomTypeName
        )
        .trim()
        .toLowerCase();


    return (
        timetableRoomTypes.find(
            type =>
                String(
                    type.type_name
                )
                .trim()
                .toLowerCase() ===
                normalized
        ) || null
    );

}




// ============================================================
// OPEN ADD ROOM FORM
// ============================================================

const addRoomBtn =
    document.getElementById(
        "addRoomBtn"
    );


if (addRoomBtn) {

    addRoomBtn.addEventListener(
        "click",
        async function() {

            if (
                !timetableState.schoolId
            ) {

                alert(
                    "Please select a school first."
                );

                return;

            }


            // =================================================
            // MAKE SURE GLOBAL ROOM TYPES ARE LOADED
            // =================================================

            if (
                timetableRoomTypes.length === 0
            ) {

                const loaded =
                    await loadRoomTypes();


                if (!loaded) {

                    alert(
                        "Failed to load room types."
                    );

                    return;

                }

            }


            // =================================================
            // OPEN FORM
            // =================================================

            await openRoomForm();

        }
    );

}


// ============================================================
// OPEN ROOM FORM
// Used for BOTH ADD and EDIT
// ============================================================

async function openRoomForm(
    room = null
) {

    const form =
        document.getElementById(
            "roomFormCard"
        );


    if (!form) {

        console.error(
            "roomFormCard element not found."
        );

        return;

    }


    // ========================================================
    // GET FORM ELEMENTS
    // ========================================================

    const roomIdInput =
        document.getElementById(
            "roomId"
        );


    const roomNameInput =
        document.getElementById(
            "roomName"
        );


    const roomTypeSelect =
        document.getElementById(
            "roomTypeSelect"
        );


    const roomCapacityInput =
        document.getElementById(
            "roomCapacity"
        );


    const title =
        document.getElementById(
            "roomFormTitle"
        );


    // ========================================================
    // ENSURE GLOBAL ROOM TYPES EXIST
    // ========================================================

    if (
        timetableRoomTypes.length === 0
    ) {

        const loaded =
            await loadRoomTypes();


        if (!loaded) {

            if (roomTypeSelect) {

                roomTypeSelect.innerHTML = `
                    <option value="">
                        Failed to load room types
                    </option>
                `;

            }


            alert(
                "Room types could not be loaded."
            );

            return;

        }

    }


    // ========================================================
    // POPULATE ROOM TYPE DROPDOWN
    // IMPORTANT
    // Do this BEFORE assigning the selected value.
    // ========================================================

    if (roomTypeSelect) {

        roomTypeSelect.innerHTML = `
            <option value="">
                Select room type
            </option>
        `;


        timetableRoomTypes.forEach(
            roomType => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    roomType.id;


                option.textContent =
                    roomType.type_name;


                roomTypeSelect.appendChild(
                    option
                );

            }
        );

    }


    // ========================================================
    // EDIT EXISTING ROOM
    // ========================================================

    if (room) {

        if (title) {

            title.textContent =
                "Edit Room";

        }


        if (roomIdInput) {

            roomIdInput.value =
                room.id || "";

        }


        if (roomNameInput) {

            roomNameInput.value =
                room.room_name || "";

        }


        if (roomCapacityInput) {

            roomCapacityInput.value =
                room.capacity || 50;

        }


        // ----------------------------------------------------
        // PRIMARY:
        // Use room_type_id
        // ----------------------------------------------------

        let roomTypeId =
            room.room_type_id || "";


        // ----------------------------------------------------
        // LEGACY FALLBACK:
        // If room_type_id is missing, use room_type text
        // ----------------------------------------------------

        if (
            !roomTypeId &&
            room.room_type
        ) {

            const matchingType =
                findRoomTypeByName(
                    room.room_type
                );


            if (matchingType) {

                roomTypeId =
                    matchingType.id;

            }

        }


        // ----------------------------------------------------
        // SET SELECTED ROOM TYPE
        // ----------------------------------------------------

        if (roomTypeSelect) {

            roomTypeSelect.value =
                roomTypeId;


            // Safety check
            // If the ID doesn't exist in the dropdown,
            // leave it unselected.

            if (
                roomTypeSelect.value !==
                roomTypeId
            ) {

                console.warn(
                    "Room type ID not found in global room types:",
                    roomTypeId
                );

                roomTypeSelect.value =
                    "";

            }

        }

    }


    // ========================================================
    // ADD NEW ROOM
    // ========================================================

    else {

        if (title) {

            title.textContent =
                "Add Room";

        }


        if (roomIdInput) {

            roomIdInput.value =
                "";

        }


        if (roomNameInput) {

            roomNameInput.value =
                "";

        }


        if (roomCapacityInput) {

            roomCapacityInput.value =
                50;

        }


        if (roomTypeSelect) {

            roomTypeSelect.value =
                "";

        }

    }


    // ========================================================
    // SHOW FORM
    // ========================================================

    form.style.display =
        "block";


    form.scrollIntoView({
        behavior:
            "smooth",
        block:
            "start"
    });

}


// ============================================================
// CANCEL ROOM FORM
// ============================================================

const cancelRoomBtn =
    document.getElementById(
        "cancelRoomBtn"
    );


if (cancelRoomBtn) {

    cancelRoomBtn.addEventListener(
        "click",
        closeRoomForm
    );

}


// ============================================================
// CLOSE ROOM FORM
// ============================================================

function closeRoomForm() {

    const form =
        document.getElementById(
            "roomFormCard"
        );


    if (form) {

        form.style.display =
            "none";

    }

}





function closeRoomForm() {

    const form =
        document.getElementById(
            "roomFormCard"
        );


    if (form) {

        form.style.display =
            "none";

    }

}


// ============================================================
// SAVE ROOM
// ============================================================

const saveRoomBtn =
    document.getElementById(
        "saveRoomBtn"
    );


if (saveRoomBtn) {

    saveRoomBtn.addEventListener(
        "click",
        saveRoom
    );

}


async function saveRoom() {

    // ========================================================
    // CHECK SCHOOL
    // ========================================================

    if (
        !timetableState.schoolId
    ) {

        alert(
            "Please select a school first."
        );

        return;

    }


    // ========================================================
    // GET VALUES
    // ========================================================

    const roomId =
        document.getElementById(
            "roomId"
        )
        ?.value
        .trim();


    const roomName =
        document.getElementById(
            "roomName"
        )
        ?.value
        .trim();


    const roomTypeId =
        document.getElementById(
            "roomTypeSelect"
        )
        ?.value
        .trim();


    const capacity =
        Number(
            document.getElementById(
                "roomCapacity"
            )
            ?.value
        );


    // ========================================================
    // VALIDATION
    // ========================================================

    if (!roomName) {

        alert(
            "Please enter the room name."
        );

        return;

    }


    if (!roomTypeId) {

        alert(
            "Please select a room type."
        );

        return;

    }


    if (
        !capacity ||
        capacity < 1
    ) {

        alert(
            "Please enter a valid room capacity."
        );

        return;

    }


    // ========================================================
    // FIND GLOBAL ROOM TYPE
    // ========================================================

    const selectedType =
        timetableRoomTypes.find(
            type =>
                type.id ===
                roomTypeId
        );


    if (!selectedType) {

        alert(
            "The selected room type could not be found."
        );

        return;

    }


    // ========================================================
    // PREPARE ROOM DATA
    // ========================================================
    //
    // room_type_id = NEW / CORRECT relationship
    //
    // room_type = kept temporarily for compatibility
    // with existing timetable generator code.
    //
    // Later we can remove room_type once the generator
    // has been fully migrated to room_type_id.
    //

    const roomData = {

        school_id:
            timetableState.schoolId,

        room_name:
            roomName,

        room_type_id:
            roomTypeId,

        room_type:
            selectedType.type_name,

        capacity:
            capacity

    };


    let result;


    // ========================================================
    // UPDATE
    // ========================================================

    if (roomId) {

        result =
            await supabaseClient

                .from(
                    "timetable_rooms"
                )

                .update(
                    roomData
                )

                .eq(
                    "id",
                    roomId
                )

                .eq(
                    "school_id",
                    timetableState.schoolId
                );

    }


    // ========================================================
    // INSERT
    // ========================================================

    else {

        result =
            await supabaseClient

                .from(
                    "timetable_rooms"
                )

                .insert(
                    roomData
                );

    }


    // ========================================================
    // ERROR
    // ========================================================

    if (result.error) {

        console.error(
            "Room save error:",
            result.error
        );


        alert(
            "Failed to save room:\n\n" +
            result.error.message
        );


        return;

    }


    // ========================================================
    // SUCCESS
    // ========================================================

    alert(
        roomId
            ? "Room updated successfully."
            : "Room added successfully."
    );


    closeRoomForm();


    await loadRooms();


    await loadDashboardData(
        timetableState.schoolId
    );

}




// ============================================================
// LOAD ROOMS
// ============================================================

async function loadRooms() {

    const container =
        document.getElementById(
            "roomsTableContainer"
        );


    if (!container) {

        return;

    }


    if (
        !timetableState.schoolId
    ) {

        container.innerHTML = `
            <div class="empty-message">
                Please select a school first.
            </div>
        `;

        return;

    }


    container.innerHTML = `
        <div class="loading-message">
            Loading rooms...
        </div>
    `;


    // ========================================================
    // LOAD GLOBAL TYPES FIRST
    // ========================================================

    if (
        timetableRoomTypes.length === 0
    ) {

        await loadRoomTypes();

    }


    // ========================================================
    // LOAD SCHOOL ROOMS
    // ========================================================

    const {
        data,
        error
    } = await supabaseClient

        .from(
            "timetable_rooms"
        )

        .select(`
            id,
            school_id,
            room_name,
            room_type,
            room_type_id,
            capacity,
            available,
            created_at
        `)

        .eq(
            "school_id",
            timetableState.schoolId
        )

        .order(
            "room_name"
        );


    // ========================================================
    // ERROR
    // ========================================================

    if (error) {

        console.error(
            "Failed to load rooms:",
            error
        );


        container.innerHTML = `
            <div class="empty-message">
                Failed to load rooms.
            </div>
        `;

        return;

    }


    // ========================================================
    // NO ROOMS
    // ========================================================

    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No rooms have been added
                for this school yet.
            </div>
        `;

        return;

    }


    // ========================================================
    // TABLE
    // ========================================================

    let html = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>Room Name</th>

                    <th>Room Type</th>

                    <th>Capacity</th>

                    <th>Available</th>

                    <th>Actions</th>

                </tr>

            </thead>

            <tbody>

    `;


    data.forEach(
        room => {

            // ------------------------------------------------
            // Determine type name
            // ------------------------------------------------

            let typeName =
                getRoomTypeName(
                    room.room_type_id
                );


            // ------------------------------------------------
            // Legacy fallback
            // ------------------------------------------------

            if (!typeName) {

                typeName =
                    room.room_type ||
                    "-";

            }


            const available =
                room.available !== false;


            html += `

                <tr>

                    <td>

                        <strong>
                            ${escapeHtml(
                                room.room_name ||
                                "-"
                            )}
                        </strong>

                    </td>


                    <td>

                        ${escapeHtml(
                            typeName
                        )}

                    </td>


                    <td>

                        ${room.capacity || "-"}

                    </td>


                    <td>

                        ${
                            available
                                ? "Yes"
                                : "No"
                        }

                    </td>


                    <td>

                        <button
                            class="action-btn edit-btn"
                            onclick='editRoom(${JSON.stringify(
                                room
                            )})'>

                            Edit

                        </button>


                        <button
                            class="action-btn delete-btn"
                            onclick="deleteRoom('${room.id}')">

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML =
        html;

}


// ============================================================
// EDIT ROOM
// ============================================================

window.editRoom =
    function(room) {

        openRoomForm(
            room
        );

    };


// ============================================================
// DELETE ROOM
// ============================================================

window.deleteRoom =
    async function(roomId) {

        if (
            !timetableState.schoolId
        ) {

            alert(
                "Please select a school."
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to delete this room?"
            );


        if (!confirmed) {

            return;

        }


        const {
            error
        } = await supabaseClient

            .from(
                "timetable_rooms"
            )

            .delete()

            .eq(
                "id",
                roomId
            )

            .eq(
                "school_id",
                timetableState.schoolId
            );


        if (error) {

            console.error(
                "Delete room error:",
                error
            );


            alert(
                "Failed to delete room:\n\n" +
                error.message
            );


            return;

        }


        alert(
            "Room deleted successfully."
        );


        await loadRooms();


        await loadDashboardData(
            timetableState.schoolId
        );

    };


// ============================================================
// LOAD ROOMS WHEN SCHOOL CHANGES
// ============================================================

if (schoolSelect) {

    schoolSelect.addEventListener(
        "change",
        async function() {

            if (
                timetableState.schoolId
            ) {

                await loadRoomTypes();

                await loadRooms();

            }

        }
    );

}


// ============================================================
// INITIAL ROOM TYPE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        await loadRoomTypes();

    }
);

// ============================================================
// REQUIREMENTS
// ROOM TYPES ARE GLOBAL
// REQUIREMENTS STORE room_type_id
// ============================================================


// ============================================================
// EDITING STATE
// ============================================================

let editingRequirementId = null;


// ============================================================
// LOAD REQUIREMENT OPTIONS
// ============================================================







// ============================================================
// POPULATE REQUIREMENT ROOM TYPE SELECT
// ============================================================

function populateRequirementRoomTypeSelect() {

    const select =
        document.getElementById(
            "requirementRoomType"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `
        <option value="">
            No special room
        </option>
    `;


    timetableRoomTypes.forEach(
        type => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                type.id;


            option.textContent =
                type.type_name;


            select.appendChild(
                option
            );

        }
    );

}







// ============================================================
// LOAD REQUIREMENT OPTIONS
// ============================================================

async function loadRequirementOptions() {

    if (!timetableState.schoolId) {

        return false;

    }


    const schoolId =
        timetableState.schoolId;


    // ========================================================
    // STREAMS
    // ========================================================

    const {
        data: streams,
        error: streamsError
    } = await supabaseClient

        .from(
            "timetable_streams"
        )

        .select(
            "id, stream_name"
        )

        .eq(
            "school_id",
            schoolId
        )

        .order(
            "stream_name"
        );


    if (streamsError) {

        console.error(
            "Failed to load streams:",
            streamsError
        );

        return false;

    }


    const streamSelect =
        document.getElementById(
            "requirementStream"
        );


    if (streamSelect) {

        streamSelect.innerHTML = `
            <option value="">
                Select stream
            </option>
        `;


        (streams || []).forEach(
            stream => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    stream.id;

                option.textContent =
                    stream.stream_name;

                streamSelect.appendChild(
                    option
                );

            }
        );

    }


    // ========================================================
    // SUBJECTS
    // ========================================================

    const {
        data: subjects,
        error: subjectsError
    } = await supabaseClient

        .from(
            "timetable_subjects"
        )

        .select(
            "id, subject_name"
        )

        .eq(
            "school_id",
            schoolId
        )

        .order(
            "subject_name"
        );


    if (subjectsError) {

        console.error(
            "Failed to load subjects:",
            subjectsError
        );

        return false;

    }


    const subjectSelect =
        document.getElementById(
            "requirementSubject"
        );


    if (subjectSelect) {

        subjectSelect.innerHTML = `
            <option value="">
                Select subject
            </option>
        `;


        (subjects || []).forEach(
            subject => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    subject.id;

                option.textContent =
                    subject.subject_name;

                subjectSelect.appendChild(
                    option
                );

            }
        );

    }


    // ========================================================
    // TEACHERS
    // ========================================================

    const {
        data: teachers,
        error: teachersError
    } = await supabaseClient

        .from(
            "timetable_teachers"
        )

        .select(
            "id, teacher_name, teacher_code"
        )

        .eq(
            "school_id",
            schoolId
        )

        .order(
            "teacher_name"
        );


    if (teachersError) {

        console.error(
            "Failed to load teachers:",
            teachersError
        );

        return false;

    }


    const teacherSelect =
        document.getElementById(
            "requirementTeacher"
        );


    if (teacherSelect) {

        teacherSelect.innerHTML = `
            <option value="">
                Select teacher
            </option>
        `;


        (teachers || []).forEach(
            teacher => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    teacher.id;

                option.textContent =
                    teacher.teacher_code
                        ? `${teacher.teacher_name} (${teacher.teacher_code})`
                        : teacher.teacher_name;

                teacherSelect.appendChild(
                    option
                );

            }
        );

    }


    // ========================================================
    // GLOBAL ROOM TYPES
    // IMPORTANT:
    // NO school_id FILTER
    // ========================================================

    const {
        data: roomTypes,
        error: roomTypesError
    } = await supabaseClient

        .from(
            "timetable_room_types"
        )

        .select(
            "id, type_name"
        )

        .order(
            "type_name"
        );


    if (roomTypesError) {

        console.error(
            "Failed to load global room types:",
            roomTypesError
        );

        return false;

    }


    const roomTypeSelect =
        document.getElementById(
            "requirementRoomType"
        );


    if (roomTypeSelect) {

        roomTypeSelect.innerHTML = `
            <option value="">
                Select room type
            </option>
        `;


        (roomTypes || []).forEach(
            roomType => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    roomType.id;

                option.textContent =
                    roomType.type_name;

                roomTypeSelect.appendChild(
                    option
                );

            }
        );

    }


    // ========================================================
    // SUCCESS
    // ========================================================

    return true;

}


// ============================================================
// SAVE BUTTON
// ============================================================

const saveRequirementBtn =
    document.getElementById(
        "saveRequirementBtn"
    );


if (saveRequirementBtn) {

    saveRequirementBtn.addEventListener(
        "click",
        saveRequirement
    );

}


// ============================================================
// SAVE OR UPDATE REQUIREMENT
// ============================================================

async function saveRequirement() {

    // ========================================================
    // CHECK SCHOOL
    // ========================================================

    if (!timetableState.schoolId) {

        alert(
            "Please select a school first."
        );

        return;

    }


    // ========================================================
    // GET FORM ELEMENTS
    // ========================================================

    const streamElement =
        document.getElementById(
            "requirementStream"
        );


    const subjectElement =
        document.getElementById(
            "requirementSubject"
        );


    const teacherElement =
        document.getElementById(
            "requirementTeacher"
        );


    const lessonsElement =
        document.getElementById(
            "requirementLessons"
        );


    const doubleLessonsElement =
        document.getElementById(
            "requirementDoubleLessons"
        );


    const maxPerDayElement =
        document.getElementById(
            "requirementMaxPerDay"
        );


    const requiresRoomElement =
        document.getElementById(
            "requirementRequiresRoom"
        );


    const roomTypeElement =
        document.getElementById(
            "requirementRoomType"
        );


    const parallelGroupElement =
        document.getElementById(
            "requirementParallelGroup"
        );


    // ========================================================
    // CHECK FORM
    // ========================================================

    if (
        !streamElement ||
        !subjectElement ||
        !teacherElement ||
        !lessonsElement ||
        !doubleLessonsElement ||
        !maxPerDayElement ||
        !requiresRoomElement ||
        !roomTypeElement
    ) {

        console.error(
            "Requirement form elements missing."
        );


        alert(
            "Requirement form is incomplete."
        );


        return;

    }


    // ========================================================
    // READ VALUES
    // ========================================================

    const streamId =
        streamElement.value.trim();


    const subjectId =
        subjectElement.value.trim();


    const teacherId =
        teacherElement.value.trim();


    const lessonsPerWeek =
        Number(
            lessonsElement.value
        );


    const doubleLessonsPerWeek =
        Number(
            doubleLessonsElement.value
        );


    const maxLessonsPerDay =
        Number(
            maxPerDayElement.value
        );


    const requiresRoom =
        requiresRoomElement.value ===
        "true";


    
const roomTypeId =
    roomTypeElement.value.trim();

    const parallelGroup =
        parallelGroupElement
            ? parallelGroupElement.value.trim()
            : "";


    // ========================================================
    // VALIDATION
    // ========================================================

    if (!streamId) {

        alert(
            "Please select a stream."
        );

        streamElement.focus();

        return;

    }


    if (!subjectId) {

        alert(
            "Please select a subject."
        );

        subjectElement.focus();

        return;

    }


    if (!teacherId) {

        alert(
            "Please select a teacher."
        );

        teacherElement.focus();

        return;

    }


    if (
        !Number.isFinite(
            lessonsPerWeek
        ) ||
        lessonsPerWeek < 1
    ) {

        alert(
            "Enter a valid number of lessons per week."
        );

        lessonsElement.focus();

        return;

    }


    if (
        !Number.isFinite(
            doubleLessonsPerWeek
        ) ||
        doubleLessonsPerWeek < 0 ||
        doubleLessonsPerWeek >
            Math.floor(
                lessonsPerWeek / 2
            )
    ) {

        alert(
            "The number of double lessons is invalid."
        );

        doubleLessonsElement.focus();

        return;

    }


    if (
        !Number.isFinite(
            maxLessonsPerDay
        ) ||
        maxLessonsPerDay < 1
    ) {

        alert(
            "Enter a valid maximum lessons per day."
        );

        maxPerDayElement.focus();

        return;

    }


    // ========================================================
    // ROOM VALIDATION
    // ========================================================

    if (
        requiresRoom &&
        !roomTypeId
    ) {

        alert(
            "Please select the required room type."
        );

        roomTypeElement.focus();

        return;

    }


    // ========================================================
    // PREPARE DATA
    // ========================================================

    const requirementData = {

        school_id:
            timetableState.schoolId,

        stream_id:
            streamId,

        subject_id:
            subjectId,

        teacher_id:
            teacherId,

        lessons_per_week:
            lessonsPerWeek,

        double_lessons_per_week:
            doubleLessonsPerWeek,

        max_lessons_per_day:
            maxLessonsPerDay,

        requires_room:
            requiresRoom,

       room_type_id:
    requiresRoom
        ? (
            roomTypeId || null
        )
        : null,

    };


    // ========================================================
    // UPDATE EXISTING
    // ========================================================

    if (editingRequirementId) {

        console.log(
            "Updating requirement:",
            editingRequirementId,
            requirementData
        );


        const {
            error
        } = await supabaseClient

            .from(
                "timetable_requirements"
            )

            .update(
                requirementData
            )

            .eq(
                "id",
                editingRequirementId
            )

            .eq(
                "school_id",
                timetableState.schoolId
            );


        if (error) {

            console.error(
                "Requirement update error:",
                error
            );


            if (
                error.code ===
                "23505"
            ) {

                alert(
                    "This stream already has a requirement for this subject."
                );

            } else {

                alert(
                    "Failed to update requirement:\n\n" +
                    error.message
                );

            }


            return;

        }


        alert(
            "Requirement updated successfully."
        );


        cancelRequirementEdit();


        await loadRequirements();


        return;

    }


    // ========================================================
    // INSERT NEW
    // ========================================================

    console.log(
        "Adding requirement:",
        requirementData
    );


    const {
        error
    } = await supabaseClient

        .from(
            "timetable_requirements"
        )

        .insert(
            requirementData
        );


    if (error) {

        console.error(
            "Requirement save error:",
            error
        );


        if (
            error.code ===
            "23505"
        ) {

            alert(
                "This stream already has a requirement for this subject."
            );

        } else {

            alert(
                "Failed to save requirement:\n\n" +
                error.message
            );

        }


        return;

    }


    alert(
        "Requirement added successfully."
    );


    cancelRequirementEdit();


    await loadRequirements();

}


// ============================================================
// EDIT REQUIREMENT
// ============================================================

window.editRequirement =
    async function(
        requirementId
    ) {

        if (!timetableState.schoolId) {

            alert(
                "Please select a school first."
            );

            return;

        }


        console.log(
            "Editing requirement:",
            requirementId
        );


        // ====================================================
        // GET REQUIREMENT
        // ====================================================

        const {
            data: requirement,
            error
        } = await supabaseClient

            .from(
                "timetable_requirements"
            )

            .select(`
                id,
                school_id,
                stream_id,
                subject_id,
                teacher_id,
                lessons_per_week,
                double_lessons_per_week,
                requires_room,
                room_type_id,
                max_lessons_per_day
            `)

            .eq(
                "id",
                requirementId
            )

            .eq(
                "school_id",
                timetableState.schoolId
            )

            .maybeSingle();


        if (error) {

            console.error(
                "Failed to load requirement:",
                error
            );


            alert(
                "Failed to load requirement:\n\n" +
                error.message
            );


            return;

        }


        if (!requirement) {

            alert(
                "Requirement not found."
            );


            return;

        }


        // ====================================================
        // LOAD OPTIONS
        // ====================================================

        const optionsLoaded =
            await loadRequirementOptions();


        if (!optionsLoaded) {

            alert(
                "Failed to load requirement options."
            );


            return;

        }


        // ====================================================
        // FORM ELEMENTS
        // ====================================================

        const streamElement =
            document.getElementById(
                "requirementStream"
            );


        const subjectElement =
            document.getElementById(
                "requirementSubject"
            );


        const teacherElement =
            document.getElementById(
                "requirementTeacher"
            );


        const lessonsElement =
            document.getElementById(
                "requirementLessons"
            );


        const doubleLessonsElement =
            document.getElementById(
                "requirementDoubleLessons"
            );


        const maxPerDayElement =
            document.getElementById(
                "requirementMaxPerDay"
            );


        const requiresRoomElement =
            document.getElementById(
                "requirementRequiresRoom"
            );


        const roomTypeElement =
            document.getElementById(
                "requirementRoomType"
            );


        // ====================================================
        // SET EDITING ID
        // ====================================================

        editingRequirementId =
            requirement.id;


        // ====================================================
        // SET BASIC VALUES
        // ====================================================

        streamElement.value =
            requirement.stream_id;


        subjectElement.value =
            requirement.subject_id;


        teacherElement.value =
            requirement.teacher_id;


        lessonsElement.value =
            requirement.lessons_per_week;


        doubleLessonsElement.value =
            requirement.double_lessons_per_week;


        maxPerDayElement.value =
            requirement.max_lessons_per_day;


        requiresRoomElement.value =
            requirement.requires_room
                ? "true"
                : "false";


        // ====================================================
        // SET ROOM TYPE
        // ====================================================

        roomTypeElement.value =
            requirement.room_type_id || "";


        // ====================================================
        // VERIFY ROOM TYPE
        // ====================================================

        if (
            requirement.requires_room &&
            requirement.room_type_id &&
            roomTypeElement.value !==
                requirement.room_type_id
        ) {

            console.error(
                "Room type ID not found:",
                requirement.room_type_id
            );

            alert(
                "The room type belonging to this requirement could not be found."
            );

            cancelRequirementEdit();

            return;

        }


        // ====================================================
        // VERIFY STREAM
        // ====================================================

        if (
            streamElement.value !==
            requirement.stream_id
        ) {

            console.error(
                "Stream ID not found:",
                requirement.stream_id
            );


            cancelRequirementEdit();


            alert(
                "The stream belonging to this requirement could not be found."
            );


            return;

        }


        // ====================================================
        // VERIFY SUBJECT
        // ====================================================

        if (
            subjectElement.value !==
            requirement.subject_id
        ) {

            console.error(
                "Subject ID not found:",
                requirement.subject_id
            );


            cancelRequirementEdit();


            alert(
                "The subject belonging to this requirement could not be found."
            );


            return;

        }


        // ====================================================
        // VERIFY TEACHER
        // ====================================================

        if (
            teacherElement.value !==
            requirement.teacher_id
        ) {

            console.error(
                "Teacher ID not found:",
                requirement.teacher_id
            );


            cancelRequirementEdit();


            alert(
                "The teacher belonging to this requirement could not be found."
            );


            return;

        }


        // ====================================================
        // SAVE BUTTON
        // ====================================================

        if (saveRequirementBtn) {

            saveRequirementBtn.innerHTML =
                "💾 Update Requirement";


            saveRequirementBtn.dataset.mode =
                "edit";

        }


        // ====================================================
        // CANCEL BUTTON
        // ====================================================

        let cancelButton =
            document.getElementById(
                "cancelRequirementEditBtn"
            );


        if (!cancelButton) {

            cancelButton =
                document.createElement(
                    "button"
                );


            cancelButton.type =
                "button";


            cancelButton.id =
                "cancelRequirementEditBtn";


            cancelButton.className =
                "action-btn";


            cancelButton.style.marginLeft =
                "10px";


            cancelButton.textContent =
                "✖ Cancel";


            cancelButton.addEventListener(
                "click",
                cancelRequirementEdit
            );


            if (
                saveRequirementBtn &&
                saveRequirementBtn.parentElement
            ) {

                saveRequirementBtn
                    .parentElement
                    .appendChild(
                        cancelButton
                    );

            }

        }


        cancelButton.style.display =
            "inline-block";


        // ====================================================
        // SCROLL TO FORM
        // ====================================================

        const formElement =
            document.getElementById(
                "requirementStream"
            );


        if (formElement) {

            formElement.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }

    };


// ============================================================
// CANCEL EDIT
// ============================================================

function cancelRequirementEdit() {

    editingRequirementId =
        null;


    // ========================================================
    // RESET BUTTON
    // ========================================================

    if (saveRequirementBtn) {

        saveRequirementBtn.innerHTML =
            "💾 Save Requirement";


        saveRequirementBtn.dataset.mode =
            "add";

    }


    // ========================================================
    // HIDE CANCEL
    // ========================================================

    const cancelButton =
        document.getElementById(
            "cancelRequirementEditBtn"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "none";

    }


    // ========================================================
    // RESET FORM
    // ========================================================

    const streamElement =
        document.getElementById(
            "requirementStream"
        );


    const subjectElement =
        document.getElementById(
            "requirementSubject"
        );


    const teacherElement =
        document.getElementById(
            "requirementTeacher"
        );


    const lessonsElement =
        document.getElementById(
            "requirementLessons"
        );


    const doubleLessonsElement =
        document.getElementById(
            "requirementDoubleLessons"
        );


    const maxPerDayElement =
        document.getElementById(
            "requirementMaxPerDay"
        );


    const requiresRoomElement =
        document.getElementById(
            "requirementRequiresRoom"
        );


    const roomTypeElement =
        document.getElementById(
            "requirementRoomType"
        );


    if (streamElement) {

        streamElement.value =
            "";

    }


    if (subjectElement) {

        subjectElement.value =
            "";

    }


    if (teacherElement) {

        teacherElement.value =
            "";

    }


    if (lessonsElement) {

        lessonsElement.value =
            "1";

    }


    if (doubleLessonsElement) {

        doubleLessonsElement.value =
            "0";

    }


    if (maxPerDayElement) {

        maxPerDayElement.value =
            "1";

    }


    if (requiresRoomElement) {

        requiresRoomElement.value =
            "false";

    }


    if (roomTypeElement) {

        roomTypeElement.value =
            "";

    }

}


// ============================================================
// LOAD REQUIREMENTS
// ============================================================

async function loadRequirements() {

    const container =
        document.getElementById(
            "requirementsTableContainer"
        );


    if (!container) {

        return;

    }


    if (!timetableState.schoolId) {

        container.innerHTML = `
            <div class="empty-message">
                Please select a school first.
            </div>
        `;

        return;

    }


    container.innerHTML = `
        <div class="loading-message">
            Loading requirements...
        </div>
    `;


    // ========================================================
    // LOAD REQUIREMENTS + GLOBAL ROOM TYPE
    // ========================================================

    const {
        data: requirements,
        error: requirementsError
    } = await supabaseClient

        .from(
            "timetable_requirements"
        )

        .select(`
            id,
            school_id,
            stream_id,
            subject_id,
            teacher_id,
            lessons_per_week,
            double_lessons_per_week,
            requires_room,
            room_type_id,
            max_lessons_per_day,
            created_at,
            timetable_room_types (
                id,
                type_name
            )
        `)

        .eq(
            "school_id",
            timetableState.schoolId
        )

        .order(
            "created_at"
        );


    if (requirementsError) {

        console.error(
            "Failed to load requirements:",
            requirementsError
        );


        container.innerHTML = `
            <div class="empty-message">
                Failed to load requirements.
            </div>
        `;


        return;

    }


    // ========================================================
    // NO REQUIREMENTS
    // ========================================================

    if (
        !requirements ||
        requirements.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No requirements have been added yet.
            </div>
        `;


        return;

    }


    // ========================================================
    // LOAD STREAMS
    // ========================================================

    const {
        data: streams,
        error: streamsError
    } = await supabaseClient

        .from(
            "timetable_streams"
        )

        .select(
            "id, stream_name"
        )

        .eq(
            "school_id",
            timetableState.schoolId
        );


    if (streamsError) {

        console.error(
            "Failed to load requirement streams:",
            streamsError
        );

        return;

    }


    // ========================================================
    // LOAD SUBJECTS
    // ========================================================

    const {
        data: subjects,
        error: subjectsError
    } = await supabaseClient

        .from(
            "timetable_subjects"
        )

        .select(
            "id, subject_name"
        )

        .eq(
            "school_id",
            timetableState.schoolId
        );


    if (subjectsError) {

        console.error(
            "Failed to load requirement subjects:",
            subjectsError
        );

        return;

    }


    // ========================================================
    // LOAD TEACHERS
    // ========================================================

    const {
        data: teachers,
        error: teachersError
    } = await supabaseClient

        .from(
            "timetable_teachers"
        )

        .select(
            "id, teacher_name, teacher_code"
        )

        .eq(
            "school_id",
            timetableState.schoolId
        );


    if (teachersError) {

        console.error(
            "Failed to load requirement teachers:",
            teachersError
        );

        return;

    }


    // ========================================================
    // LOOKUP MAPS
    // ========================================================

    const streamMap = {};

    (streams || []).forEach(
        stream => {

            streamMap[
                stream.id
            ] =
                stream.stream_name;

        }
    );


    const subjectMap = {};

    (subjects || []).forEach(
        subject => {

            subjectMap[
                subject.id
            ] =
                subject.subject_name;

        }
    );


    const teacherMap = {};

    (teachers || []).forEach(
        teacher => {

            teacherMap[
                teacher.id
            ] =
                teacher.teacher_name;

        }
    );


    // ========================================================
    // BUILD TABLE
    // ========================================================

    let html = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>Stream</th>

                    <th>Subject</th>

                    <th>Teacher</th>

                    <th>Lessons / Week</th>

                    <th>Double / Week</th>

                    <th>Room Type</th>

                    <th>Max / Day</th>

                    <th>Actions</th>

                </tr>

            </thead>

            <tbody>

    `;


    requirements.forEach(
        requirement => {

            const streamName =
                streamMap[
                    requirement.stream_id
                ] || "—";


            const subjectName =
                subjectMap[
                    requirement.subject_id
                ] || "—";


            const teacherName =
                teacherMap[
                    requirement.teacher_id
                ] || "—";


            const roomTypeName =
                requirement.requires_room
                    ? (
                        requirement
                            .timetable_room_types
                            ?.type_name ||
                        "Special room"
                    )
                    : "None";


            html += `

                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                streamName
                            )}
                        </strong>
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
                        ${requirement.lessons_per_week}
                    </td>


                    <td>
                        ${requirement.double_lessons_per_week}
                    </td>


                    <td>
                        ${escapeHtml(
                            roomTypeName
                        )}
                    </td>


                    <td>
                        ${requirement.max_lessons_per_day}
                    </td>


                    <td>

                        <button
                            type="button"
                            class="action-btn edit-btn"
                            onclick="
                                window.editRequirement(
                                    '${requirement.id}'
                                )
                            "
                        >
                            ✏️ Edit
                        </button>


                        <button
                            type="button"
                            class="action-btn delete-btn"
                            onclick="
                                window.deleteRequirement(
                                    '${requirement.id}'
                                )
                            "
                        >
                            🗑️ Delete
                        </button>

                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML =
        html;

}


// ============================================================
// DELETE REQUIREMENT
// ============================================================

window.deleteRequirement =
    async function(
        requirementId
    ) {

        if (!timetableState.schoolId) {

            alert(
                "Please select a school first."
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to delete this requirement?"
            );


        if (!confirmed) {

            return;

        }


        console.log(
            "Deleting requirement:",
            requirementId
        );


        const {
            error
        } = await supabaseClient

            .from(
                "timetable_requirements"
            )

            .delete()

            .eq(
                "id",
                requirementId
            )

            .eq(
                "school_id",
                timetableState.schoolId
            );


        if (error) {

            console.error(
                "Delete requirement error:",
                error
            );


            alert(
                "Failed to delete requirement:\n\n" +
                error.message
            );


            return;

        }


        alert(
            "Requirement deleted successfully."
        );


        await loadRequirements();

    };


// ============================================================
// 18. PERIOD MANAGEMENT
// ============================================================
//
// DESIGN
// ------------------------------------------------------------
// timetable_period_templates
//      ↓
// Standard master template
//
// timetable_periods
//      ↓
// School-specific copy
//
// RULES
// ------------------------------------------------------------
// 1. A school does NOT manually add periods.
// 2. First time a school is opened:
//      - Check timetable_periods for that school.
//      - If none exist, copy the standard template.
// 3. If periods already exist:
//      - NEVER copy the template again.
//      - Load the school's existing periods.
// 4. Editing affects ONLY that school.
// 5. The master template is NEVER edited.
// 6. Monday-Friday only.
// 7. Saturday is not supported.
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const PERIOD_TEMPLATE_TABLE =
    "timetable_period_templates";

const PERIOD_SCHOOL_TABLE =
    "timetable_periods";


// ============================================================
// DAYS
// ============================================================

const PERIOD_DAY_NUMBERS = {

    Monday: 1,

    Tuesday: 2,

    Wednesday: 3,

    Thursday: 4,

    Friday: 5

};


// ============================================================
// OPEN PERIOD FORM
// ============================================================
//
// There is NO "Add Period" functionality.
// Schools customize periods by editing existing periods.
// ============================================================

function openPeriodForm(period = null) {

    const form =
        document.getElementById(
            "periodFormCard"
        );

    if (!form) {

        console.error(
            "periodFormCard was not found."
        );

        return;

    }


    if (!period) {

        console.error(
            "openPeriodForm requires an existing period."
        );

        return;

    }


    // --------------------------------------------------------
    // GET ELEMENTS
    // --------------------------------------------------------

    const periodFormTitle =
        document.getElementById(
            "periodFormTitle"
        );

    const periodId =
        document.getElementById(
            "periodId"
        );

    const dayName =
        document.getElementById(
            "periodDayName"
        );

    const dayNumber =
        document.getElementById(
            "periodDayNumber"
        );

    const periodNumber =
        document.getElementById(
            "periodNumber"
        );

    const periodOrder =
        document.getElementById(
            "periodOrder"
        );

    const periodName =
        document.getElementById(
            "periodName"
        );

    const startTime =
        document.getElementById(
            "periodStartTime"
        );

    const endTime =
        document.getElementById(
            "periodEndTime"
        );

    const periodType =
        document.getElementById(
            "periodType"
        );

    const isTeachingPeriod =
        document.getElementById(
            "isTeachingPeriod"
        );


    // --------------------------------------------------------
    // CHECK ELEMENTS
    // --------------------------------------------------------

    const elements = {

        periodFormTitle,

        periodId,

        dayName,

        dayNumber,

        periodNumber,

        periodOrder,

        periodName,

        startTime,

        endTime,

        periodType,

        isTeachingPeriod

    };


    const missingElements =
        Object.keys(elements).filter(
            key => !elements[key]
        );


    if (
        missingElements.length > 0
    ) {

        console.error(
            "PERIOD FORM MISSING ELEMENTS:",
            missingElements
        );

        alert(
            "Period form is missing:\n\n" +
            missingElements.join("\n")
        );

        return;

    }


    // --------------------------------------------------------
    // SHOW FORM
    // --------------------------------------------------------

    form.style.display =
        "block";


    // --------------------------------------------------------
    // EDIT ONLY
    // --------------------------------------------------------

    periodFormTitle.textContent =
        "Edit Period";


    periodId.value =
        period.id || "";


    dayName.value =
        period.day_name || "";


    dayNumber.value =
        period.day_number || "";


    periodNumber.value =
        period.period_number || "";


    periodOrder.value =
        period.period_order || "";


    periodName.value =
        period.period_name || "";


    startTime.value =
        period.start_time
            ? String(
                period.start_time
              ).substring(
                0,
                5
              )
            : "";


    endTime.value =
        period.end_time
            ? String(
                period.end_time
              ).substring(
                0,
                5
              )
            : "";


    periodType.value =
        period.period_type || "lesson";


    isTeachingPeriod.checked =
        period.is_teaching_period === true;


    // --------------------------------------------------------
    // DAY CANNOT BE CHANGED
    // --------------------------------------------------------
    //
    // The school is customizing the template.
    // We keep day/number/order controlled by the template
    // structure and only allow schedule details to be edited.
    // --------------------------------------------------------

    dayName.disabled =
        true;

    dayNumber.readOnly =
        true;

    periodNumber.readOnly =
        true;

    periodOrder.readOnly =
        true;


    // --------------------------------------------------------
    // SCROLL
    // --------------------------------------------------------

    form.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

}


// ============================================================
// CLOSE PERIOD FORM
// ============================================================

const cancelPeriodBtn =
    document.getElementById(
        "cancelPeriodBtn"
    );


if (cancelPeriodBtn) {

    cancelPeriodBtn.addEventListener(
        "click",
        closePeriodForm
    );

}


function closePeriodForm() {

    const form =
        document.getElementById(
            "periodFormCard"
        );


    if (form) {

        form.style.display =
            "none";

    }

}


// ============================================================
// SAVE PERIOD
// ============================================================
//
// IMPORTANT:
// This function ONLY updates an existing school period.
//
// It NEVER inserts a new period.
// It NEVER modifies the master template.
// ============================================================

const savePeriodBtn =
    document.getElementById(
        "savePeriodBtn"
    );


if (savePeriodBtn) {

    savePeriodBtn.addEventListener(
        "click",
        savePeriod
    );

}


async function savePeriod() {

    // --------------------------------------------------------
    // CHECK SCHOOL
    // --------------------------------------------------------

    if (!timetableState.schoolId) {

        alert(
            "Please select a school first."
        );

        return;

    }


    // --------------------------------------------------------
    // GET ELEMENTS
    // --------------------------------------------------------

    const periodIdElement =
        document.getElementById(
            "periodId"
        );

    const dayNameElement =
        document.getElementById(
            "periodDayName"
        );

    const dayNumberElement =
        document.getElementById(
            "periodDayNumber"
        );

    const periodNumberElement =
        document.getElementById(
            "periodNumber"
        );

    const periodOrderElement =
        document.getElementById(
            "periodOrder"
        );

    const periodNameElement =
        document.getElementById(
            "periodName"
        );

    const startTimeElement =
        document.getElementById(
            "periodStartTime"
        );

    const endTimeElement =
        document.getElementById(
            "periodEndTime"
        );

    const periodTypeElement =
        document.getElementById(
            "periodType"
        );

    const teachingElement =
        document.getElementById(
            "isTeachingPeriod"
        );


    // --------------------------------------------------------
    // SAFETY CHECK
    // --------------------------------------------------------

    if (
        !periodIdElement ||
        !dayNameElement ||
        !dayNumberElement ||
        !periodNumberElement ||
        !periodOrderElement ||
        !periodNameElement ||
        !startTimeElement ||
        !endTimeElement ||
        !periodTypeElement ||
        !teachingElement
    ) {

        console.error(
            "Period form elements are missing."
        );

        alert(
            "The Period form is incomplete. Please check the HTML."
        );

        return;

    }


    // --------------------------------------------------------
    // GET VALUES
    // --------------------------------------------------------

    const periodId =
        periodIdElement.value.trim();


    if (!periodId) {

        alert(
            "This period does not have a valid ID."
        );

        return;

    }


    const dayName =
        dayNameElement.value.trim();


    const dayNumber =
        Number(
            dayNumberElement.value
        );


    const periodNumber =
        Number(
            periodNumberElement.value
        );


    const periodOrder =
        Number(
            periodOrderElement.value
        );


    const periodName =
        periodNameElement.value.trim();


    const startTime =
        startTimeElement.value;


    const endTime =
        endTimeElement.value;


    const periodType =
        periodTypeElement.value;


    const isTeachingPeriod =
        teachingElement.checked;


    // --------------------------------------------------------
    // VALIDATE DAY
    // --------------------------------------------------------

    if (
        !PERIOD_DAY_NUMBERS[
            dayName
        ]
    ) {

        alert(
            "Only Monday to Friday are allowed."
        );

        return;

    }


    if (
        dayNumber < 1 ||
        dayNumber > 5
    ) {

        alert(
            "Invalid day number."
        );

        return;

    }


    // --------------------------------------------------------
    // VALIDATE PERIOD NUMBER
    // --------------------------------------------------------

    if (
        !periodNumber ||
        periodNumber < 1
    ) {

        alert(
            "Invalid period number."
        );

        return;

    }


    // --------------------------------------------------------
    // VALIDATE NAME
    // --------------------------------------------------------

    if (!periodName) {

        alert(
            "Please enter a period name."
        );

        return;

    }


    // --------------------------------------------------------
    // VALIDATE TIMES
    // --------------------------------------------------------

    if (!startTime) {

        alert(
            "Please enter the start time."
        );

        return;

    }


    if (!endTime) {

        alert(
            "Please enter the end time."
        );

        return;

    }


    if (
        startTime >= endTime
    ) {

        alert(
            "End time must be later than start time."
        );

        return;

    }


    // --------------------------------------------------------
    // PREPARE UPDATE
    // --------------------------------------------------------

    const periodData = {

        // These are deliberately NOT school_id.
        // school ownership is already established by
        // the WHERE conditions below.

        period_name:
            periodName,

        start_time:
            startTime,

        end_time:
            endTime,

        period_type:
            periodType,

        is_teaching_period:
            isTeachingPeriod

    };


    console.log(
        "Updating school period:",
        {

            schoolId:
                timetableState.schoolId,

            periodId,

            periodData

        }
    );


    // ========================================================
    // UPDATE ONLY THIS SCHOOL'S PERIOD
    // ========================================================

    const {
        error
    } = await supabaseClient

        .from(
            PERIOD_SCHOOL_TABLE
        )

        .update(
            periodData
        )

        .eq(
            "id",
            periodId
        )

        .eq(
            "school_id",
            timetableState.schoolId
        );


    // --------------------------------------------------------
    // ERROR
    // --------------------------------------------------------

    if (error) {

        console.error(
            "Period update error:",
            error
        );

        alert(
            "Failed to update period:\n\n" +
            error.message
        );

        return;

    }


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    alert(
        "Period updated successfully."
    );


    closePeriodForm();


    await loadPeriods();

}


// ============================================================
// LOAD PERIODS
// ============================================================
//
// This is the most important part.
//
// FIRST:
// Look for existing periods belonging to this school.
//
// IF FOUND:
//     Load them.
//     DO NOT TOUCH TEMPLATE.
//
// IF NOT FOUND:
//     Copy timetable_period_templates once.
//     Then load the newly created school periods.
// ============================================================

async function loadPeriods() {

    const container =
        document.getElementById(
            "periodsTableContainer"
        );


    if (!container) {

        return;

    }


    // --------------------------------------------------------
    // NO SCHOOL
    // --------------------------------------------------------

    if (!timetableState.schoolId) {

        container.innerHTML = `

            <div class="empty-message">

                Please select a school first.

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="loading-message">

            Loading school periods...

        </div>

    `;


    const schoolId =
        timetableState.schoolId;


    console.log(
        "Loading periods for school:",
        schoolId
    );


    // ========================================================
    // STEP 1
    // CHECK WHETHER SCHOOL ALREADY HAS PERIODS
    // ========================================================

    const {
        data: schoolPeriods,
        error: schoolPeriodsError
    } = await supabaseClient

        .from(
            PERIOD_SCHOOL_TABLE
        )

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
        );


    if (schoolPeriodsError) {

        console.error(
            "Failed to check school periods:",
            schoolPeriodsError
        );


        container.innerHTML = `

            <div class="empty-message">

                Failed to load periods.

                <br><br>

                ${escapeHtml(
                    schoolPeriodsError.message
                )}

            </div>

        `;

        return;

    }


    // ========================================================
    // STEP 2
    // SCHOOL ALREADY HAS PERIODS
    // ========================================================

    if (
        schoolPeriods &&
        schoolPeriods.length > 0
    ) {

        console.log(
            "School already has periods.",
            schoolPeriods.length
        );


        // ----------------------------------------------------
        // IMPORTANT:
        // DO NOT COPY TEMPLATE AGAIN.
        // ----------------------------------------------------

        renderPeriods(
            schoolPeriods
        );

        return;

    }


    // ========================================================
    // STEP 3
    // SCHOOL HAS NO PERIODS
    // ========================================================
    //
    // This means this is the first setup.
    //
    // Load the master template.
    // ========================================================

    console.log(
        "No periods found for school."
    );


    container.innerHTML = `

        <div class="loading-message">

            Setting up the standard school timetable...

        </div>

    `;


    const {
        data: templatePeriods,
        error: templateError
    } = await supabaseClient

        .from(
            PERIOD_TEMPLATE_TABLE
        )

        .select(
            `
                day_name,
                day_number,
                period_number,
                period_name,
                start_time,
                end_time,
                period_type,
                is_teaching_period,
                period_order
            `
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
        );


    // --------------------------------------------------------
    // TEMPLATE ERROR
    // --------------------------------------------------------

    if (templateError) {

        console.error(
            "Failed to load period template:",
            templateError
        );


        container.innerHTML = `

            <div class="empty-message">

                Failed to load the standard period template.

                <br><br>

                ${escapeHtml(
                    templateError.message
                )}

            </div>

        `;

        return;

    }


    // --------------------------------------------------------
    // TEMPLATE EMPTY
    // --------------------------------------------------------

    if (
        !templatePeriods ||
        templatePeriods.length === 0
    ) {

        console.error(
            "Period template is empty."
        );


        container.innerHTML = `

            <div class="empty-message">

                The standard period template is empty.

            </div>

        `;

        return;

    }


    console.log(
        "Standard template loaded:",
        templatePeriods.length,
        "periods"
    );


    // ========================================================
    // STEP 4
    // SAFETY CHECK
    // ========================================================
    //
    // Only Monday-Friday are allowed.
    //
    // If an accidental Saturday row exists in the template,
    // it will NOT be copied.
    // ========================================================

    const cleanTemplate =
        templatePeriods.filter(
            period => {

                return (

                    period.day_number >= 1 &&

                    period.day_number <= 5 &&

                    period.day_name !== "Saturday"

                );

            }
        );


    if (
        cleanTemplate.length === 0
    ) {

        alert(
            "The standard period template contains no Monday-Friday periods."
        );

        return;

    }


    // ========================================================
    // STEP 5
    // PREPARE SCHOOL COPY
    // ========================================================

    const schoolPeriodRows =
        cleanTemplate.map(
            period => ({

                school_id:
                    schoolId,

                day_name:
                    period.day_name,

                day_number:
                    period.day_number,

                period_number:
                    period.period_number,

                period_name:
                    period.period_name,

                start_time:
                    period.start_time,

                end_time:
                    period.end_time,

                period_type:
                    period.period_type,

                is_teaching_period:
                    period.is_teaching_period,

                period_order:
                    period.period_order

            })
        );


    console.log(
        "Creating school-specific periods:",
        schoolPeriodRows.length
    );


    // ========================================================
    // STEP 6
    // INSERT TEMPLATE COPY INTO SCHOOL
    // ========================================================

    const {
        data: insertedPeriods,
        error: insertError
    } = await supabaseClient

        .from(
            PERIOD_SCHOOL_TABLE
        )

        .insert(
            schoolPeriodRows
        )

        .select();


    // --------------------------------------------------------
    // INSERT ERROR
    // --------------------------------------------------------

    if (insertError) {

        console.error(
            "Failed to create school periods:",
            insertError
        );


        container.innerHTML = `

            <div class="empty-message">

                Failed to create the school's period structure.

                <br><br>

                ${escapeHtml(
                    insertError.message
                )}

            </div>

        `;

        return;

    }


    console.log(
        "School period structure created:",
        insertedPeriods
            ? insertedPeriods.length
            : schoolPeriodRows.length
    );


    // ========================================================
    // STEP 7
    // DISPLAY SCHOOL'S COPY
    // ========================================================

    renderPeriods(
        insertedPeriods ||
        schoolPeriodRows
    );

}


// ============================================================
// LOAD STANDARD CBC PERIODS
// ============================================================
//
// ONE FUNCTION ONLY
//
// Rules:
// 1. School must be selected.
// 2. Check timetable_periods first.
// 3. If periods already exist -> load/display them.
// 4. If none exist -> load master template.
// 5. Copy Monday-Friday only.
// 6. Never duplicate periods.
// 7. Never modify timetable_period_templates.
// ============================================================

async function loadStandardPeriods() {

    console.log(
        "======================================"
    );

    console.log(
        "LOAD STANDARD CBC PERIODS"
    );

    console.log(
        "======================================"
    );


    // ========================================================
    // CHECK SUPABASE
    // ========================================================

    if (
        !supabaseClient
    ) {

        console.error(
            "supabaseClient is not available."
        );

        alert(
            "Supabase is not initialized."
        );

        return;

    }


    // ========================================================
    // CHECK SCHOOL
    // ========================================================

    if (
        !timetableState ||
        !timetableState.schoolId
    ) {

        alert(
            "Please select a school first."
        );

        return;

    }


    const schoolId =
        timetableState.schoolId;


    console.log(
        "School ID:",
        schoolId
    );


    // ========================================================
    // GET CONTAINER
    // ========================================================

    const container =
        document.getElementById(
            "periodsTableContainer"
        );


    if (container) {

        container.innerHTML = `

            <div class="loading-message">

                Loading standard timetable periods...

            </div>

        `;

    }


    try {


        // ====================================================
        // STEP 1
        // CHECK EXISTING SCHOOL PERIODS
        // ====================================================

        console.log(
            "Checking existing school periods..."
        );


        const {
            data: existingPeriods,
            error: existingError
        } = await supabaseClient

            .from(
                PERIOD_SCHOOL_TABLE
            )

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
            );


        // ====================================================
        // EXISTING PERIOD ERROR
        // ====================================================

        if (
            existingError
        ) {

            console.error(
                "Failed checking school periods:",
                existingError
            );

            if (container) {

                container.innerHTML = `

                    <div class="empty-message">

                        Failed to check school periods.

                        <br><br>

                        ${escapeHtml(
                            existingError.message
                        )}

                    </div>

                `;

            }

            alert(
                "Failed to check school periods:\n\n" +
                existingError.message
            );

            return;

        }


        // ====================================================
        // STEP 2
        // SCHOOL ALREADY HAS PERIODS
        // ====================================================
        //
        // DO NOT COPY TEMPLATE.
        //
        // This is important because your database already
        // contains the school's periods.
        // ====================================================

        if (
            existingPeriods &&
            existingPeriods.length > 0
        ) {

            console.log(
                "School already has periods:",
                existingPeriods.length
            );


            renderPeriods(
                existingPeriods
            );


            alert(
                "This school already has " +
                existingPeriods.length +
                " timetable periods.\n\n" +
                "The standard template was NOT copied again."
            );


            return;

        }


        // ====================================================
        // STEP 3
        // NO SCHOOL PERIODS
        // ====================================================

        console.log(
            "No school periods found."
        );


        if (container) {

            container.innerHTML = `

                <div class="loading-message">

                    Loading the standard CBC period template...

                </div>

            `;

        }


        // ====================================================
        // STEP 4
        // LOAD MASTER TEMPLATE
        // ====================================================

        const {
            data: templatePeriods,
            error: templateError
        } = await supabaseClient

            .from(
                PERIOD_TEMPLATE_TABLE
            )

            .select(
                `
                    day_name,
                    day_number,
                    period_number,
                    period_name,
                    start_time,
                    end_time,
                    period_type,
                    is_teaching_period,
                    period_order
                `
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
            );


        // ====================================================
        // TEMPLATE ERROR
        // ====================================================

        if (
            templateError
        ) {

            console.error(
                "Failed loading period template:",
                templateError
            );


            if (container) {

                container.innerHTML = `

                    <div class="empty-message">

                        Failed to load standard timetable template.

                        <br><br>

                        ${escapeHtml(
                            templateError.message
                        )}

                    </div>

                `;

            }


            alert(
                "Failed to load standard timetable template:\n\n" +
                templateError.message
            );


            return;

        }


        // ====================================================
        // TEMPLATE EMPTY
        // ====================================================

        if (
            !templatePeriods ||
            templatePeriods.length === 0
        ) {

            console.error(
                "Standard period template is empty."
            );


            if (container) {

                container.innerHTML = `

                    <div class="empty-message">

                        The standard timetable template is empty.

                    </div>

                `;

            }


            alert(
                "The standard timetable template is empty."
            );


            return;

        }


        console.log(
            "Template periods loaded:",
            templatePeriods.length
        );


        // ====================================================
        // STEP 5
        // MONDAY-FRIDAY ONLY
        // ====================================================

        const cleanTemplate =
            templatePeriods.filter(
                period => {

                    return (

                        Number(
                            period.day_number
                        ) >= 1 &&

                        Number(
                            period.day_number
                        ) <= 5 &&

                        period.day_name !==
                            "Saturday"

                    );

                }
            );


        if (
            cleanTemplate.length === 0
        ) {

            alert(
                "The standard timetable template contains no Monday-Friday periods."
            );

            return;

        }


        console.log(
            "Monday-Friday template periods:",
            cleanTemplate.length
        );


        // ====================================================
        // STEP 6
        // CREATE SCHOOL-SPECIFIC COPY
        // ====================================================

        const schoolPeriodRows =
            cleanTemplate.map(
                period => ({

                    school_id:
                        schoolId,

                    day_name:
                        period.day_name,

                    day_number:
                        Number(
                            period.day_number
                        ),

                    period_number:
                        Number(
                            period.period_number
                        ),

                    period_name:
                        period.period_name,

                    start_time:
                        period.start_time,

                    end_time:
                        period.end_time,

                    period_type:
                        period.period_type,

                    is_teaching_period:
                        period.is_teaching_period === true,

                    period_order:
                        Number(
                            period.period_order
                        )

                })
            );


        console.log(
            "Creating school periods:",
            schoolPeriodRows.length
        );


        // ====================================================
        // STEP 7
        // INSERT
        // ====================================================

        const {
            data: insertedPeriods,
            error: insertError
        } = await supabaseClient

            .from(
                PERIOD_SCHOOL_TABLE
            )

            .insert(
                schoolPeriodRows
            )

            .select();


        // ====================================================
        // INSERT ERROR
        // ====================================================

        if (
            insertError
        ) {

            console.error(
                "Failed creating school periods:",
                insertError
            );


            if (container) {

                container.innerHTML = `

                    <div class="empty-message">

                        Failed to create school periods.

                        <br><br>

                        ${escapeHtml(
                            insertError.message
                        )}

                    </div>

                `;

            }


            alert(
                "Failed to create school periods:\n\n" +
                insertError.message
            );


            return;

        }


        // ====================================================
        // STEP 8
        // SUCCESS
        // ====================================================

        console.log(
            "School periods successfully created:",
            insertedPeriods
                ? insertedPeriods.length
                : 0
        );


        // ====================================================
        // DISPLAY
        // ====================================================

        renderPeriods(
            insertedPeriods ||
            schoolPeriodRows
        );


        alert(
            "Standard CBC timetable periods loaded successfully.\n\n" +
            (
                insertedPeriods
                    ? insertedPeriods.length
                    : schoolPeriodRows.length
            ) +
            " periods created."
        );


    } catch (
        error
    ) {


        // ====================================================
        // UNEXPECTED ERROR
        // ====================================================

        console.error(
            "Unexpected error loading standard periods:",
            error
        );


        if (container) {

            container.innerHTML = `

                <div class="empty-message">

                    An unexpected error occurred while loading periods.

                    <br><br>

                    ${escapeHtml(
                        error.message ||
                        String(error)
                    )}

                </div>

            `;

        }


        alert(
            "Unexpected error:\n\n" +
            (
                error.message ||
                String(error)
            )
        );

    }

}




// ============================================================
// RENDER PERIODS
// ============================================================

function renderPeriods(
    data
) {

    const container =
        document.getElementById(
            "periodsTableContainer"
        );


    if (!container) {

        return;

    }


    // --------------------------------------------------------
    // SAFETY FILTER
    // --------------------------------------------------------

    const cleanData =
        (data || [])
            .filter(
                period => {

                    return (

                        period.day_number >= 1 &&

                        period.day_number <= 5 &&

                        period.day_name !== "Saturday"

                    );

                }
            )
            .sort(
                (a, b) => {

                    if (
                        a.day_number !==
                        b.day_number
                    ) {

                        return (
                            a.day_number -
                            b.day_number
                        );

                    }

                    return (
                        a.period_order -
                        b.period_order
                    );

                }
            );


    if (
        cleanData.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-message">

                No periods are configured for this school.

            </div>

        `;

        return;

    }


    // ========================================================
    // TABLE
    // ========================================================

    let html = `

        <div class="periods-info-card">

            <strong>
                ⏰ School Period Structure
            </strong>

            <p>
                These periods were created from the
                standard timetable template.
                You can customize the schedule by
                editing a period.
            </p>

        </div>


        <table class="data-table">

            <thead>

                <tr>

                    <th>Day</th>

                    <th>Period</th>

                    <th>Name</th>

                    <th>Start</th>

                    <th>End</th>

                    <th>Type</th>

                    <th>Teaching</th>

                    <th>Action</th>

                </tr>

            </thead>

            <tbody>

    `;


    cleanData.forEach(
        period => {

            const periodJson =
                JSON.stringify(
                    period
                )
                .replace(
                    /'/g,
                    "&#39;"
                );


            const typeLabel =
                getPeriodTypeLabel(
                    period.period_type
                );


            html += `

                <tr>

                    <td>

                        <strong>

                            ${escapeHtml(
                                period.day_name || ""
                            )}

                        </strong>

                    </td>


                    <td>

                        ${escapeHtml(
                            String(
                                period.period_number || ""
                            )
                        )}

                    </td>


                    <td>

                        ${escapeHtml(
                            period.period_name || ""
                        )}

                    </td>


                    <td>

                        ${formatPeriodTime(
                            period.start_time
                        )}

                    </td>


                    <td>

                        ${formatPeriodTime(
                            period.end_time
                        )}

                    </td>


                    <td>

                        ${escapeHtml(
                            typeLabel
                        )}

                    </td>


                    <td>

                        ${
                            period.is_teaching_period
                                ? "Yes"
                                : "No"
                        }

                    </td>


                    <td>

                        <button

                            type="button"

                            class="action-btn edit-btn"

                            onclick='editPeriod(${periodJson})'>

                            ✏️ Edit

                        </button>

                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML =
        html;


    console.log(
        "School periods rendered:",
        cleanData.length
    );

}


// ============================================================
// PERIOD TYPE LABEL
// ============================================================

function getPeriodTypeLabel(
    type
) {

    const labels = {

        lesson:
            "Lesson",

        registration:
            "Registration",

        break:
            "Break",

        lunch:
            "Lunch",

        assembly:
            "Assembly",

        activity:
            "Activity",

        other:
            "Other"

    };


    return (
        labels[type] ||
        type ||
        "Other"
    );

}


// ============================================================
// FORMAT TIME
// ============================================================

function formatPeriodTime(
    value
) {

    if (!value) {

        return "";

    }


    return String(
        value
    ).substring(
        0,
        5
    );

}


// ============================================================
// EDIT PERIOD
// ============================================================

window.editPeriod =
    function(period) {

        if (!period) {

            console.error(
                "No period supplied for editing."
            );

            return;

        }


        // ----------------------------------------------------
        // NEVER allow Saturday
        // ----------------------------------------------------

        if (
            period.day_number > 5 ||
            period.day_name === "Saturday"
        ) {

            alert(
                "Saturday periods are not supported."
            );

            return;

        }


        openPeriodForm(
            period
        );

    };


// ============================================================
// DELETE PERIOD
// ============================================================
//
// IMPORTANT:
// Delete is intentionally disabled.
//
// This guarantees that if a school has already received
// its template, it can never accidentally return to a
// "zero periods" state and trigger another template copy.
//
// Schools customize periods by EDITING them.
// ============================================================

window.deletePeriod =
    function() {

        alert(
            "Periods cannot be deleted. You can edit the period to customize the school's timetable."
        );

    };


// ============================================================
// HIDE ADD PERIOD BUTTON
// ============================================================
//
// The school should receive the standard structure automatically.
// It should not manually create periods.
// ============================================================

const addPeriodBtn =
    document.getElementById(
        "addPeriodBtn"
    );


if (addPeriodBtn) {

    addPeriodBtn.style.display =
        "none";

}


// ============================================================
// DISABLE ADD-PERIOD FORM
// ============================================================
//
// If the old form is accidentally opened by another script,
// prevent it from being used as an Add form.
// ============================================================

function disablePeriodCreationUI() {

    const form =
        document.getElementById(
            "periodFormCard"
        );


    if (!form) {

        return;

    }


    const title =
        document.getElementById(
            "periodFormTitle"
        );


    if (title) {

        title.textContent =
            "Edit Period";

    }

}


// ============================================================
// LOAD PERIODS WHEN SCHOOL CHANGES
// ============================================================
//
// IMPORTANT:
// timetableState.schoolId must already be set by your
// school-selection code before loadPeriods() runs.
// ============================================================

if (typeof schoolSelect !== "undefined" && schoolSelect) {

    schoolSelect.addEventListener(
        "change",
        async function() {

            // ------------------------------------------------
            // Do not load until the existing school-selection
            // code has updated timetableState.schoolId.
            // ------------------------------------------------

            if (
                timetableState &&
                timetableState.schoolId
            ) {

                await loadPeriods();

            }

        }
    );

}


// ============================================================
// MANUAL CALL AVAILABLE
// ============================================================
//
// Other parts of the timetable application can call:
//
//     loadPeriods();
//
// ============================================================

window.loadPeriods =
    loadPeriods;


// ============================================================
// PERIOD FORM FIELD BEHAVIOUR
// ============================================================
//
// Day, day number, period number and period order are part
// of the standard structure and should not be changed.
// ============================================================

const periodDayName =
    document.getElementById(
        "periodDayName"
    );


const periodDayNumber =
    document.getElementById(
        "periodDayNumber"
    );


const periodNumberInput =
    document.getElementById(
        "periodNumber"
    );


const periodOrderInput =
    document.getElementById(
        "periodOrder"
    );


if (periodDayName) {

    periodDayName.disabled =
        true;

}


if (periodDayNumber) {

    periodDayNumber.readOnly =
        true;

}


if (periodNumberInput) {

    periodNumberInput.readOnly =
        true;

}


if (periodOrderInput) {

    periodOrderInput.readOnly =
        true;

}


// ============================================================
// PERIOD NAME
// ============================================================
//
// Name CAN be customized.
// Example:
//
// Period 1
// Mathematics
// Assembly
// Morning Lesson
//
// We therefore do NOT automatically overwrite the name.
// ============================================================


// ============================================================
// INITIAL PERIOD FORM STATE
// ============================================================

disablePeriodCreationUI();


// ============================================================
// END PERIOD MANAGEMENT
// ============================================================




































// ============================================================
// LOAD CLASSES FOR STREAM FORM
// ============================================================

async function loadStreamClasses() {

    const classSelect =
        document.getElementById(
            "streamClassId"
        );


    if (!classSelect) {

        console.error(
            "streamClassId was not found."
        );

        return;

    }


    // --------------------------------------------------------
    // CHECK SCHOOL
    // --------------------------------------------------------

    if (!timetableState.schoolId) {

        classSelect.innerHTML = `
            <option value="">
                Please select a school first
            </option>
        `;

        return;

    }


    // --------------------------------------------------------
    // SHOW LOADING
    // --------------------------------------------------------

    classSelect.innerHTML = `
        <option value="">
            Loading classes...
        </option>
    `;


    // ========================================================
    // LOAD CLASSES
    // IMPORTANT:
    // timetable_classes uses class_name
    // ========================================================

    const {
        data,
        error
    } = await supabaseClient

        .from(
            "timetable_classes"
        )

        .select(
            "id, school_id, class_name, class_level, created_at"
        )

        .eq(
            "school_id",
            timetableState.schoolId
        )

        .order(
            "class_name",
            {
                ascending: true
            }
        );


    // ========================================================
    // ERROR
    // ========================================================

    if (error) {

        console.error(
            "Failed to load classes:",
            error
        );


        classSelect.innerHTML = `
            <option value="">
                Failed to load classes
            </option>
        `;


        alert(
            "Failed to load classes:\n\n" +
            error.message
        );


        return;

    }


    // ========================================================
    // NO CLASSES
    // ========================================================

    if (
        !data ||
        data.length === 0
    ) {

        classSelect.innerHTML = `
            <option value="">
                No classes found
            </option>
        `;


        console.log(
            "No classes found for school:",
            timetableState.schoolId
        );


        return;

    }


    // ========================================================
    // BUILD DROPDOWN
    // ========================================================

    let html = `
        <option value="">
            Select class
        </option>
    `;


    data.forEach(
        schoolClass => {

            html += `

                <option
                    value="${schoolClass.id}">

                    ${escapeHtml(
                        schoolClass.class_name || "Unnamed Class"
                    )}

                </option>

            `;

        }
    );


    classSelect.innerHTML =
        html;


    console.log(
        "Stream classes loaded:",
        data.length,
        data
    );

}







async function loadStreams() {

   console.log("🔥🔥🔥 LOAD STREAMS FUNCTION CALLED 🔥🔥🔥");

    
    const container =
        document.getElementById(
            "streamsTableContainer"
        );


    if (!container) {

        return;

    }


    // --------------------------------------------------------
    // CHECK SCHOOL
    // --------------------------------------------------------

    if (!timetableState.schoolId) {

        container.innerHTML = `
            <div class="empty-message">
                Please select a school first.
            </div>
        `;

        return;

    }


    // --------------------------------------------------------
    // LOADING
    // --------------------------------------------------------

    container.innerHTML = `
        <div class="loading-message">
            Loading streams...
        </div>
    `;


    // ========================================================
    // LOAD CLASSES SEPARATELY
    // ========================================================

    const {
        data: classes,
        error: classesError
    } = await supabaseClient

        .from(
            "timetable_classes"
        )

        .select(
            "id, class_name, class_level"
        )

        .eq(
            "school_id",
            timetableState.schoolId
        );


    // ========================================================
    // CLASS ERROR
    // ========================================================

    if (classesError) {

        console.error(
            "Failed to load classes:",
            classesError
        );


        container.innerHTML = `
            <div class="empty-message">

                Failed to load classes.

                <br><br>

                ${escapeHtml(
                    classesError.message
                )}

            </div>
        `;

        return;

    }


    // ========================================================
    // CREATE CLASS LOOKUP
    // ========================================================

    const classMap = {};


    (classes || []).forEach(
        schoolClass => {

            classMap[
                schoolClass.id
            ] =
                schoolClass.class_name ||
                "Unknown Class";

        }
    );


    console.log(
        "Stream class map:",
        classMap
    );


    // ========================================================
    // LOAD STREAMS
    // ========================================================

    const {
        data,
        error
    } = await supabaseClient

        .from(
            "timetable_streams"
        )

        .select(
            "id, school_id, class_id, stream_name, room_name, capacity, created_at"
        )

        .eq(
            "school_id",
            timetableState.schoolId
        )

        .order(
            "stream_name",
            {
                ascending: true
            }
        );


    // ========================================================
    // STREAM ERROR
    // ========================================================

    if (error) {

        console.error(
            "Failed to load streams:",
            error
        );


        container.innerHTML = `
            <div class="empty-message">

                Failed to load streams.

                <br><br>

                ${escapeHtml(
                    error.message
                )}

            </div>
        `;

        return;

    }


    // ========================================================
    // NO STREAMS
    // ========================================================

    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">

                No streams have been added
                for this school yet.

            </div>
        `;

        return;

    }


    // ========================================================
    // BUILD TABLE
    // ========================================================

    let html = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>Class</th>

                    <th>Stream</th>

                    <th>Room</th>

                    <th>Capacity</th>

                    <th>Actions</th>

                </tr>

            </thead>

            <tbody>

    `;


    data.forEach(
        stream => {

            // ------------------------------------------------
            // FIND CLASS NAME
            // ------------------------------------------------

            const className =
                classMap[
                    stream.class_id
                ] ||
                "Unknown Class";


            html += `

                <tr>

                    <td>

                        <strong>

                            ${escapeHtml(
                                className
                            )}

                        </strong>

                    </td>


                    <td>

                        ${escapeHtml(
                            stream.stream_name || ""
                        )}

                    </td>


                    <td>

                        ${escapeHtml(
                            stream.room_name || "-"
                        )}

                    </td>


                    <td>

                        ${stream.capacity || "-"}

                    </td>


                    <td>

                        <button
                            type="button"
                            class="action-btn edit-btn"
                            onclick='editStream(${JSON.stringify(
                                stream
                            )})'>

                            Edit

                        </button>


                        <button
                            type="button"
                            class="action-btn delete-btn"
                            onclick="deleteStream('${stream.id}')">

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        }
    );


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML =
        html;


    console.log(
        "Streams loaded:",
        data.length
    );

}

const addStreamBtn =
    document.getElementById(
        "addStreamBtn"
    );


if (addStreamBtn) {

    addStreamBtn.addEventListener(
        "click",
        async function () {

            // ------------------------------------------------
            // CHECK SCHOOL
            // ------------------------------------------------

            if (!timetableState.schoolId) {

                alert(
                    "Please select a school first."
                );

                return;

            }


            // ------------------------------------------------
            // LOAD CLASSES
            // ------------------------------------------------

            await loadStreamClasses();


            // ------------------------------------------------
            // OPEN FORM
            // ------------------------------------------------

            openStreamForm();

        }
    );

}


// ============================================================
// OPEN STREAM FORM
// ============================================================

function openStreamForm(
    stream = null
) {

    const form =
        document.getElementById(
            "streamFormCard"
        );


    if (!form) {

        console.error(
            "streamFormCard was not found."
        );

        return;

    }


    // --------------------------------------------------------
    // GET ELEMENTS
    // --------------------------------------------------------

    const streamFormTitle =
        document.getElementById(
            "streamFormTitle"
        );


    const streamId =
        document.getElementById(
            "streamId"
        );


    const streamClassId =
        document.getElementById(
            "streamClassId"
        );


    const streamName =
        document.getElementById(
            "streamName"
        );


    const streamRoomName =
        document.getElementById(
            "streamRoomName"
        );


    const streamCapacity =
        document.getElementById(
            "streamCapacity"
        );


    // --------------------------------------------------------
    // CHECK ELEMENTS
    // --------------------------------------------------------

    const elements = {

        streamFormTitle,
        streamId,
        streamClassId,
        streamName,
        streamRoomName,
        streamCapacity

    };


    const missingElements =
        Object.keys(elements).filter(
            key =>
                !elements[key]
        );


    if (
        missingElements.length > 0
    ) {

        console.error(
            "STREAM FORM MISSING ELEMENTS:",
            missingElements
        );


        alert(
            "Stream form is missing:\n\n" +
            missingElements.join("\n")
        );


        return;

    }


    // --------------------------------------------------------
    // SHOW FORM
    // --------------------------------------------------------

    form.style.display =
        "block";


    // ========================================================
    // EDIT EXISTING STREAM
    // ========================================================

    if (stream) {

        streamFormTitle.textContent =
            "Edit Stream";


        streamId.value =
            stream.id || "";


        streamClassId.value =
            stream.class_id || "";


        streamName.value =
            stream.stream_name || "";


        streamRoomName.value =
            stream.room_name || "";


        streamCapacity.value =
            stream.capacity || 50;

    }


    // ========================================================
    // ADD NEW STREAM
    // ========================================================

    else {

        streamFormTitle.textContent =
            "Add Stream";


        streamId.value =
            "";


        streamClassId.value =
            "";


        streamName.value =
            "";


        streamRoomName.value =
            "";


        streamCapacity.value =
            50;

    }


    // --------------------------------------------------------
    // SCROLL TO FORM
    // --------------------------------------------------------

    form.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

}



// ============================================================
// CLOSE STREAM FORM
// ============================================================

function closeStreamForm() {

    const form =
        document.getElementById(
            "streamFormCard"
        );


    if (form) {

        form.style.display =
            "none";

    }

}


// ============================================================
// CANCEL STREAM FORM
// ============================================================

const cancelStreamBtn =
    document.getElementById(
        "cancelStreamBtn"
    );

if (cancelStreamBtn) {

    cancelStreamBtn.addEventListener(
        "click",
        closeStreamForm
    );

}



// ============================================================
// SAVE STREAM
// ============================================================

const saveStreamBtn =
    document.getElementById("saveStreamBtn");

if (saveStreamBtn) {

    console.log(
        "Save Stream button found."
    );

    saveStreamBtn.addEventListener(
        "click",
        async function () {

            console.log(
                "SAVE STREAM BUTTON CLICKED"
            );

            await saveStream();

        }
    );

}
else {

    console.error(
        "saveStreamBtn was NOT found."
    );

}


// ============================================================
// SAVE STREAM FUNCTION
// ============================================================

async function saveStream() {

    console.log(
        "saveStream() started..."
    );


    // --------------------------------------------------------
    // CHECK SCHOOL
    // --------------------------------------------------------

    if (!timetableState.schoolId) {

        alert(
            "Please select a school first."
        );

        return;

    }


    // --------------------------------------------------------
    // GET FORM ELEMENTS
    // --------------------------------------------------------

    const streamIdElement =
        document.getElementById(
            "streamId"
        );


    const streamClassIdElement =
        document.getElementById(
            "streamClassId"
        );


    const streamNameElement =
        document.getElementById(
            "streamName"
        );


    const streamRoomNameElement =
        document.getElementById(
            "streamRoomName"
        );


    const streamCapacityElement =
        document.getElementById(
            "streamCapacity"
        );


    // --------------------------------------------------------
    // CHECK ELEMENTS
    // --------------------------------------------------------

    if (
        !streamIdElement ||
        !streamClassIdElement ||
        !streamNameElement ||
        !streamRoomNameElement ||
        !streamCapacityElement
    ) {

        console.error(
            "STREAM FORM ELEMENTS MISSING"
        );

        alert(
            "Stream form is incomplete. Please check the HTML."
        );

        return;

    }


    // --------------------------------------------------------
    // GET VALUES
    // --------------------------------------------------------

    const streamId =
        streamIdElement.value.trim();


    const classId =
        streamClassIdElement.value.trim();


    const streamName =
        streamNameElement.value.trim();


    const roomName =
        streamRoomNameElement.value.trim();


    const capacity =
        Number(
            streamCapacityElement.value
        );


    console.log(
        "Stream values:",
        {
            streamId,
            classId,
            streamName,
            roomName,
            capacity
        }
    );


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!classId) {

        alert(
            "Please select a class."
        );

        return;

    }


    if (!streamName) {

        alert(
            "Please enter the stream name."
        );

        return;

    }


    if (
        !capacity ||
        capacity < 1
    ) {

        alert(
            "Please enter a valid stream capacity."
        );

        return;

    }


    // --------------------------------------------------------
    // PREPARE DATA
    // --------------------------------------------------------

    const streamData = {

        school_id:
            timetableState.schoolId,

        class_id:
            classId,

        stream_name:
            streamName,

        room_name:
            roomName || null,

        capacity:
            capacity

    };


    console.log(
        "STREAM DATA TO SAVE:",
        streamData
    );


    // --------------------------------------------------------
    // DISABLE BUTTON WHILE SAVING
    // --------------------------------------------------------

    if (saveStreamBtn) {

        saveStreamBtn.disabled = true;

        saveStreamBtn.textContent =
            "⏳ Saving...";

    }


    let result;


    try {

        // ====================================================
        // UPDATE EXISTING STREAM
        // ====================================================

        if (streamId) {

            console.log(
                "Updating stream:",
                streamId
            );


            result =
                await supabaseClient

                    .from(
                        "timetable_streams"
                    )

                    .update(
                        streamData
                    )

                    .eq(
                        "id",
                        streamId
                    )

                    .eq(
                        "school_id",
                        timetableState.schoolId
                    )

                    .select();


        }


        // ====================================================
        // INSERT NEW STREAM
        // ====================================================

        else {

            console.log(
                "Inserting new stream..."
            );


            result =
                await supabaseClient

                    .from(
                        "timetable_streams"
                    )

                    .insert(
                        streamData
                    )

                    .select();

        }


        // ----------------------------------------------------
        // DATABASE ERROR
        // ----------------------------------------------------

        if (result.error) {

            console.error(
                "STREAM SAVE ERROR:",
                result.error
            );


            alert(
                "Failed to save stream:\n\n" +
                result.error.message
            );


            return;

        }


        // ----------------------------------------------------
        // CHECK RESULT
        // ----------------------------------------------------

        console.log(
            "STREAM SAVED SUCCESSFULLY:",
            result.data
        );


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        alert(
            streamId
                ? "Stream updated successfully."
                : "Stream added successfully."
        );


        // ----------------------------------------------------
        // CLOSE FORM
        // ----------------------------------------------------

        closeStreamForm();


        // ----------------------------------------------------
        // RELOAD STREAMS
        // ----------------------------------------------------

        await loadStreams();

    }

    catch (error) {

        console.error(
            "Unexpected stream save error:",
            error
        );


        alert(
            "An unexpected error occurred:\n\n" +
            error.message
        );

    }

    finally {

        // ----------------------------------------------------
        // RESTORE BUTTON
        // ----------------------------------------------------

        if (saveStreamBtn) {

            saveStreamBtn.disabled = false;

            saveStreamBtn.textContent =
                "💾 Save Stream";

        }

    }

}




window.editStream =
    async function(stream) {

        // ----------------------------------------------------
        // CHECK SCHOOL
        // ----------------------------------------------------

        if (!timetableState.schoolId) {

            alert(
                "Please select a school first."
            );

            return;

        }


        // ----------------------------------------------------
        // LOAD CLASSES
        // ----------------------------------------------------

        await loadStreamClasses();


        // ----------------------------------------------------
        // OPEN FORM
        // ----------------------------------------------------

        openStreamForm(
            stream
        );

    };


// ============================================================
// DELETE STREAM
// ============================================================

window.deleteStream =
    async function(streamId) {

        // ----------------------------------------------------
        // CHECK SCHOOL
        // ----------------------------------------------------

        if (!timetableState.schoolId) {

            alert(
                "Please select a school first."
            );

            return;

        }


        // ----------------------------------------------------
        // CHECK ID
        // ----------------------------------------------------

        if (!streamId) {

            alert(
                "Invalid stream ID."
            );

            return;

        }


        // ----------------------------------------------------
        // CONFIRM
        // ----------------------------------------------------

        const confirmed =
            confirm(
                "Are you sure you want to delete this stream?"
            );


        if (!confirmed) {

            return;

        }


        // ====================================================
        // DELETE
        // ====================================================

        const {
            error
        } = await supabaseClient

            .from(
                "timetable_streams"
            )

            .delete()

            .eq(
                "id",
                streamId
            )

            .eq(
                "school_id",
                timetableState.schoolId
            );


        // ----------------------------------------------------
        // ERROR
        // ----------------------------------------------------

        if (error) {

            console.error(
                "Delete stream error:",
                error
            );


            alert(
                "Failed to delete stream:\n\n" +
                error.message
            );


            return;

        }


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        alert(
            "Stream deleted successfully."
        );


        await loadStreams();

    };


// ============================================================
// LOAD STREAMS WHEN SCHOOL CHANGES
// ============================================================



if (schoolSelect) {

    schoolSelect.addEventListener(
        "change",
        async function () {

            const schoolId =
                this.value;


            // =================================================
            // NO SCHOOL SELECTED
            // =================================================

            if (!schoolId) {

                timetableState.schoolId =
                    null;

                timetableState.schoolName =
                    null;


                const schoolNameElement =
                    document.getElementById(
                        "schoolName"
                    );


                if (schoolNameElement) {

                    schoolNameElement.textContent =
                        "No school selected";

                }


                resetDashboardCounts();


                generatedTimetableEntries =
                    [];


                hideTimetableGenerationStatus();


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


                return;

            }


            // =================================================
            // SAVE SELECTED SCHOOL
            // =================================================

            const selectedOption =
                this.options[
                    this.selectedIndex
                ];


            const schoolName =
                selectedOption
                    ? selectedOption.textContent
                    : "Unknown School";


            timetableState.schoolId =
                schoolId;


            timetableState.schoolName =
                schoolName;


            const schoolNameElement =
                document.getElementById(
                    "schoolName"
                );


            if (schoolNameElement) {

                schoolNameElement.textContent =
                    schoolName;

            }


            console.log(
                "Selected timetable school:",
                schoolName
            );


            console.log(
                "Selected school ID:",
                schoolId
            );


            // =================================================
            // DASHBOARD
            // =================================================

            await loadDashboardData(
                schoolId
            );

             await loadStreams();

            
            // =================================================
            // GENERATED TIMETABLE
            // =================================================

            generatedTimetableEntries =
                [];


            hideTimetableGenerationStatus();


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


            // =================================================
            // LOAD GENERATOR DATA
            // =================================================

            try {

                await loadTimetableFilters();

                await loadGeneratedTimetable();

            }

            catch (error) {

                console.error(
                    "Failed to load timetable generator:",
                    error
                );

            }

        }
    );

}















document.addEventListener(
    "DOMContentLoaded",
    function () {

        const loadStandardPeriodsBtn =
            document.getElementById(
                "loadStandardPeriodsBtn"
            );

        if (
            loadStandardPeriodsBtn
        ) {

            loadStandardPeriodsBtn.addEventListener(
                "click",
                loadStandardPeriods
            );

            console.log(
                "Load Standard CBC Periods button connected."
            );

        } else {

            console.error(
                "loadStandardPeriodsBtn was not found."
            );

        }

    }
);



initializeApp();
