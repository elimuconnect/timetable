// ============================================================
// SMART TIMETABLE GENERATOR
// app.js
// ============================================================


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


    select.innerHTML =
        `
        <option value="">
            Select school
        </option>
        `;


    if (!data || data.length === 0) {

        select.innerHTML =
            `
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


            if (!schoolId) {

                timetableState.schoolId =
                    null;

                timetableState.schoolName =
                    null;


                document.getElementById(
                    "schoolName"
                ).textContent =
                    "No school selected";


                resetDashboardCounts();


                return;

            }


            const selectedOption =
                this.options[
                    this.selectedIndex
                ];


            const schoolName =
                selectedOption.textContent;


            timetableState.schoolId =
                schoolId;


            timetableState.schoolName =
                schoolName;


            document.getElementById(
                "schoolName"
            ).textContent =
                schoolName;


            console.log(
                "Selected timetable school:",
                schoolName
            );


            console.log(
                "Selected school ID:",
                schoolId
            );


            await loadDashboardData(
                schoolId
            );

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
                === String(schoolId)
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
// 12. GENERATE TIMETABLE
// ============================================================

const generateButton =
    document.getElementById(
        "generateBtn"
    );


if (generateButton) {

    generateButton.addEventListener(
        "click",
        async function () {

            // -----------------------------------------------
            // CHECK SCHOOL
            // -----------------------------------------------

            if (!timetableState.schoolId) {

                alert(
                    "Please select a school first."
                );

                return;

            }


            // -----------------------------------------------
            // CONFIRM
            // -----------------------------------------------

            const confirmed =
                confirm(
                    `Generate timetable for ${timetableState.schoolName}?`
                );


            if (!confirmed) {

                return;

            }


            console.log(
                "Starting timetable generation..."
            );


            // -----------------------------------------------
            // TEMPORARY MESSAGE
            // -----------------------------------------------

            generateButton.disabled =
                true;


            generateButton.textContent =
                "⏳ Preparing...";


            try {

                /*
                 * The actual automatic timetable
                 * generation algorithm will be added
                 * in a later step.
                 */

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            1000
                        )
                );


                alert(
                    "The timetable generator is ready to be connected. We will build the automatic scheduling algorithm next."
                );


            } catch (error) {

                console.error(
                    "Generation error:",
                    error
                );


                alert(
                    "An error occurred while preparing the timetable."
                );


            } finally {

                generateButton.disabled =
                    false;


                generateButton.textContent =
                    "⚡ Generate Timetable";

            }

        }
    );

}


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


// ------------------------------------------------------------
// OPEN ADD ROOM FORM
// ------------------------------------------------------------

const addRoomBtn =
    document.getElementById("addRoomBtn");


if (addRoomBtn) {

    addRoomBtn.addEventListener(
        "click",
        () => {

            if (!timetableState.schoolId) {

                alert(
                    "Please select a school first."
                );

                return;

            }

            openRoomForm();

        }
    );

}


// ------------------------------------------------------------
// OPEN ROOM FORM
// ------------------------------------------------------------

function openRoomForm(room = null) {

    const form =
        document.getElementById(
            "roomFormCard"
        );


    if (!form) return;


    form.style.display = "block";


    if (room) {

        document.getElementById(
            "roomFormTitle"
        ).textContent =
            "Edit Room";


        document.getElementById(
            "roomId"
        ).value =
            room.id;


        document.getElementById(
            "roomName"
        ).value =
            room.room_name || "";


        document.getElementById(
            "roomTypeSelect"
        ).value =
            room.room_type || "Classroom";


        document.getElementById(
            "roomCapacity"
        ).value =
            room.capacity || 50;

    } else {

        document.getElementById(
            "roomFormTitle"
        ).textContent =
            "Add Room";


        document.getElementById(
            "roomId"
        ).value =
            "";


        document.getElementById(
            "roomName"
        ).value =
            "";


        document.getElementById(
            "roomTypeSelect"
        ).value =
            "Classroom";


        document.getElementById(
            "roomCapacity"
        ).value =
            50;

    }


    form.scrollIntoView({
        behavior: "smooth"
    });

}


// ------------------------------------------------------------
// CANCEL ROOM FORM
// ------------------------------------------------------------

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


// ------------------------------------------------------------
// SAVE ROOM
// ------------------------------------------------------------

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
    // GET VALUES
    // -----------------------------------------

    const roomId =
        document.getElementById(
            "roomId"
        ).value.trim();


    const roomName =
        document.getElementById(
            "roomName"
        ).value.trim();


    const roomType =
        document.getElementById(
            "roomTypeSelect"
        ).value;


    const capacity =
        Number(
            document.getElementById(
                "roomCapacity"
            ).value
        );


    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!roomName) {

        alert(
            "Please enter the room name."
        );

        return;

    }


    if (!capacity || capacity < 1) {

        alert(
            "Please enter a valid room capacity."
        );

        return;

    }


    // -----------------------------------------
    // PREPARE DATA
    // -----------------------------------------

    const roomData = {

        school_id:
            timetableState.schoolId,

        room_name:
            roomName,

        room_type:
            roomType,

        capacity:
            capacity

    };


    let result;


    // -----------------------------------------
    // UPDATE
    // -----------------------------------------

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


    // -----------------------------------------
    // INSERT
    // -----------------------------------------

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


    // -----------------------------------------
    // ERROR
    // -----------------------------------------

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


    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

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


// ------------------------------------------------------------
// LOAD ROOMS
// ------------------------------------------------------------

async function loadRooms() {

    const container =
        document.getElementById(
            "roomsTableContainer"
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
            Loading rooms...
        </div>
        `;


    const {
        data,
        error
    } = await supabaseClient

        .from(
            "timetable_rooms"
        )

        .select("*")

        .eq(
            "school_id",
            timetableState.schoolId
        )

        .order(
            "room_name"
        );


    if (error) {

        console.error(
            "Failed to load rooms:",
            error
        );


        container.innerHTML =
            `
            <div class="empty-message">
                Failed to load rooms.
            </div>
            `;

        return;

    }


    if (!data || data.length === 0) {

        container.innerHTML =
            `
            <div class="empty-message">
                No rooms have been added
                for this school yet.
            </div>
            `;

        return;

    }


    let html = `

        <table class="data-table">

            <thead>

                <tr>

                    <th>Room</th>

                    <th>Type</th>

                    <th>Capacity</th>

                    <th>Actions</th>

                </tr>

            </thead>

            <tbody>

    `;


    data.forEach(room => {

        html += `

            <tr>

                <td>

                    <strong>
                        ${escapeHtml(
                            room.room_name
                        )}
                    </strong>

                </td>


                <td>

                    ${escapeHtml(
                        room.room_type || "-"
                    )}

                </td>


                <td>

                    ${room.capacity || "-"}

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

    });


    html += `

            </tbody>

        </table>

    `;


    container.innerHTML =
        html;

}


// ------------------------------------------------------------
// EDIT ROOM
// ------------------------------------------------------------

window.editRoom =
    function(room) {

        openRoomForm(
            room
        );

    };


// ------------------------------------------------------------
// DELETE ROOM
// ------------------------------------------------------------

window.deleteRoom =
    async function(roomId) {

        if (!timetableState.schoolId) {

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


// ------------------------------------------------------------
// LOAD ROOMS WHEN SCHOOL CHANGES
// ------------------------------------------------------------

if (schoolSelect) {

    schoolSelect.addEventListener(
        "change",
        async function() {

            if (
                timetableState.schoolId
            ) {

                await loadRooms();

            }

        }
    );

}

// ============================================================
// REQUIREMENTS
// ADD / EDIT / DELETE
// ============================================================


// ============================================================
// EDITING STATE
// ============================================================

let editingRequirementId = null;


// ============================================================
// LOAD REQUIREMENT OPTIONS
// ============================================================

async function loadRequirementOptions() {

    if (!timetableState.schoolId) {
        return false;
    }


    const schoolId =
        timetableState.schoolId;


    // --------------------------------------------------------
    // STREAMS
    // --------------------------------------------------------

    const {
        data: streams,
        error: streamsError
    } = await supabaseClient

        .from("timetable_streams")

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


    // --------------------------------------------------------
    // SUBJECTS
    // --------------------------------------------------------

    const {
        data: subjects,
        error: subjectsError
    } = await supabaseClient

        .from("timetable_subjects")

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


    // --------------------------------------------------------
    // TEACHERS
    // --------------------------------------------------------

    const {
        data: teachers,
        error: teachersError
    } = await supabaseClient

        .from("timetable_teachers")

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


    // --------------------------------------------------------
    // CHECK FORM
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // READ VALUES
    // --------------------------------------------------------

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
        requiresRoomElement.value === "true";


    const roomType =
        roomTypeElement.value.trim();


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // PREPARE DATA
    // --------------------------------------------------------

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

        requires_room:
            requiresRoom,

        room_type:
            requiresRoom
                ? (
                    roomType || null
                )
                : null,

        max_lessons_per_day:
            maxLessonsPerDay

    };


    // ========================================================
    // UPDATE EXISTING
    // ========================================================

    if (editingRequirementId) {

        console.log(
            "Updating requirement:",
            editingRequirementId
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
                error.code === "23505"
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
            error.code === "23505"
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


    await loadRequirements();

}


// ============================================================
// EDIT REQUIREMENT
// ============================================================

window.editRequirement =
    async function (
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


        // ----------------------------------------------------
        // GET REQUIREMENT
        // ----------------------------------------------------

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
                room_type,
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


        // ----------------------------------------------------
        // IMPORTANT
        // LOAD OPTIONS FIRST
        // ----------------------------------------------------

        const optionsLoaded =
            await loadRequirementOptions();


        if (!optionsLoaded) {

            alert(
                "Failed to load requirement options."
            );

            return;
        }


        // ----------------------------------------------------
        // GET FORM ELEMENTS
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // SET EDITING ID
        // ----------------------------------------------------

        editingRequirementId =
            requirement.id;


        // ----------------------------------------------------
        // SET SELECTS
        // ----------------------------------------------------

        streamElement.value =
            requirement.stream_id;

        subjectElement.value =
            requirement.subject_id;

        teacherElement.value =
            requirement.teacher_id;


        // ----------------------------------------------------
        // VERIFY SELECTS
        // ----------------------------------------------------

        if (
            streamElement.value !==
            requirement.stream_id
        ) {

            console.error(
                "Stream ID not found in options:",
                requirement.stream_id
            );

            cancelRequirementEdit();

            alert(
                "The stream belonging to this requirement could not be found."
            );

            return;
        }


        if (
            subjectElement.value !==
            requirement.subject_id
        ) {

            console.error(
                "Subject ID not found in options:",
                requirement.subject_id
            );

            cancelRequirementEdit();

            alert(
                "The subject belonging to this requirement could not be found."
            );

            return;
        }


        if (
            teacherElement.value !==
            requirement.teacher_id
        ) {

            console.error(
                "Teacher ID not found in options:",
                requirement.teacher_id
            );

            cancelRequirementEdit();

            alert(
                "The teacher belonging to this requirement could not be found."
            );

            return;
        }


        // ----------------------------------------------------
        // SET OTHER VALUES
        // ----------------------------------------------------

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


        roomTypeElement.value =
            requirement.room_type || "";


        // ----------------------------------------------------
        // CHANGE SAVE BUTTON
        // ----------------------------------------------------

        if (saveRequirementBtn) {

            saveRequirementBtn.innerHTML =
                "💾 Update Requirement";

            saveRequirementBtn.dataset.mode =
                "edit";

        }


        // ----------------------------------------------------
        // CREATE CANCEL BUTTON
        // ----------------------------------------------------

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

                saveRequirementBtn.parentElement
                    .appendChild(
                        cancelButton
                    );

            }

        }


        cancelButton.style.display =
            "inline-block";


        // ----------------------------------------------------
        // SCROLL TO FORM
        // ----------------------------------------------------

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


    // --------------------------------------------------------
    // RESET BUTTON
    // --------------------------------------------------------

    if (saveRequirementBtn) {

        saveRequirementBtn.innerHTML =
            "💾 Save Requirement";

        saveRequirementBtn.dataset.mode =
            "add";

    }


    // --------------------------------------------------------
    // HIDE CANCEL
    // --------------------------------------------------------

    const cancelButton =
        document.getElementById(
            "cancelRequirementEditBtn"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "none";

    }


    // --------------------------------------------------------
    // RESET FORM
    // --------------------------------------------------------

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
            "";

    }


    if (doubleLessonsElement) {

        doubleLessonsElement.value =
            "";

    }


    if (maxPerDayElement) {

        maxPerDayElement.value =
            "";

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
    // LOAD REQUIREMENTS
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
            room_type,
            max_lessons_per_day,
            created_at
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

                    <th>Room</th>

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


            const room =
                requirement.requires_room

                    ? (
                        requirement.room_type ||
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
                            room
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
    async function (
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


// ============================================================
// OPEN ADD PERIOD FORM
// ============================================================

const addPeriodBtn =
    document.getElementById("addPeriodBtn");

if (addPeriodBtn) {

    addPeriodBtn.addEventListener(
        "click",
        function () {

            if (!timetableState.schoolId) {

                alert(
                    "Please select a school first."
                );

                return;
            }

            openPeriodForm();

        }
    );

}


// ============================================================
// OPEN PERIOD FORM
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


    // ========================================================
    // EDIT EXISTING PERIOD
    // ========================================================

    if (period) {

        periodFormTitle.textContent =
            "Edit Period";


        periodId.value =
            period.id || "";


        dayName.value =
            period.day_name || "";


        dayNumber.value =
            period.day_number || 1;


        periodNumber.value =
            period.period_number || 1;


        periodOrder.value =
            period.period_order ||
            (
                (
                    (period.day_number || 1) - 1
                ) * 100
            ) +
            (
                period.period_number || 1
            );


        periodName.value =
            period.period_name ||
            `Period ${period.period_number || 1}`;


        startTime.value =
            period.start_time || "";


        endTime.value =
            period.end_time || "";


        periodType.value =
            period.period_type || "lesson";


        isTeachingPeriod.checked =
            period.is_teaching_period !== false;

    }


    // ========================================================
    // ADD NEW PERIOD
    // ========================================================

    else {

        periodFormTitle.textContent =
            "Add Period";


        periodId.value =
            "";


        dayName.value =
            "";


        dayNumber.value =
            1;


        periodNumber.value =
            1;


        periodOrder.value =
            1;


        periodName.value =
            "Period 1";


        startTime.value =
            "";


        endTime.value =
            "";


        periodType.value =
            "lesson";


        isTeachingPeriod.checked =
            true;

    }


    // --------------------------------------------------------
    // SCROLL TO FORM
    // --------------------------------------------------------

    form.scrollIntoView({
        behavior: "smooth"
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
            "Cannot save period because form elements are missing."
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


    const startTime =
        startTimeElement.value;


    const endTime =
        endTimeElement.value;


    const periodType =
        periodTypeElement.value;


    const isTeachingPeriod =
        teachingElement.checked;


    // --------------------------------------------------------
    // AUTOMATIC PERIOD ORDER
    // --------------------------------------------------------

    const periodOrder =
        (
            (dayNumber - 1) * 100
        ) +
        periodNumber;


    // --------------------------------------------------------
    // AUTOMATIC PERIOD NAME
    // --------------------------------------------------------

    let periodName =
        periodNameElement.value.trim();


    if (!periodName) {

        if (
            periodType === "lesson"
        ) {

            periodName =
                `Period ${periodNumber}`;

        }

        else {

            const selectedOption =
                periodTypeElement.options[
                    periodTypeElement.selectedIndex
                ];


            periodName =
                selectedOption
                    ? selectedOption.textContent.trim()
                    : "Period";
        }

    }


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!dayName) {

        alert(
            "Please select the day."
        );

        return;
    }


    if (
        !dayNumber ||
        dayNumber < 1 ||
        dayNumber > 6
    ) {

        alert(
            "Please select a valid day."
        );

        return;
    }


    if (
        !periodNumber ||
        periodNumber < 1
    ) {

        alert(
            "Please enter a valid period number."
        );

        return;
    }


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
    // UPDATE FORM DISPLAY
    // --------------------------------------------------------

    periodNameElement.value =
        periodName;


    periodOrderElement.value =
        periodOrder;


    // --------------------------------------------------------
    // PREPARE DATA
    // --------------------------------------------------------

    const periodData = {

        school_id:
            timetableState.schoolId,

        day_name:
            dayName,

        day_number:
            dayNumber,

        period_number:
            periodNumber,

        period_order:
            periodOrder,

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
        "Saving period:",
        periodData
    );


    let result;


    // ========================================================
    // UPDATE EXISTING PERIOD
    // ========================================================

    if (periodId) {

        result =
            await supabaseClient

                .from(
                    "timetable_periods"
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

    }


    // ========================================================
    // INSERT NEW PERIOD
    // ========================================================

    else {

        result =
            await supabaseClient

                .from(
                    "timetable_periods"
                )

                .insert(
                    periodData
                );

    }


    // --------------------------------------------------------
    // DATABASE ERROR
    // --------------------------------------------------------

    if (result.error) {

        console.error(
            "Period save error:",
            result.error
        );

        alert(
            "Failed to save period:\n\n" +
            result.error.message
        );

        return;
    }


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    alert(
        periodId
            ? "Period updated successfully."
            : "Period added successfully."
    );


    closePeriodForm();


    await loadPeriods();

}


// ============================================================
// LOAD PERIODS
// ============================================================

async function loadPeriods() {

    const container =
        document.getElementById(
            "periodsTableContainer"
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
            Loading periods...
        </div>
    `;


    const {
        data,
        error
    } = await supabaseClient

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
        );


    if (error) {

        console.error(
            "Failed to load periods:",
            error
        );


        container.innerHTML = `
            <div class="empty-message">

                Failed to load periods.

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
            <div class="empty-message">

                No periods have been added
                for this school yet.

            </div>
        `;

        return;
    }


    // --------------------------------------------------------
    // BUILD TABLE
    // --------------------------------------------------------

    let html = `

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

                    <th>Actions</th>

                </tr>

            </thead>

            <tbody>

    `;


    data.forEach(
        period => {

            html += `

                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                period.day_name
                            )}
                        </strong>
                    </td>


                    <td>
                        ${period.period_number}
                    </td>


                    <td>
                        ${escapeHtml(
                            period.period_name
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            period.start_time
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            period.end_time
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            period.period_type
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
                            onclick='editPeriod(${JSON.stringify(
                                period
                            )})'>

                            ✏️ Edit

                        </button>


                        <button
                            type="button"
                            class="action-btn delete-btn"
                            onclick="deletePeriod('${period.id}')">

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


    console.log(
        "Periods loaded:",
        data.length
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


        openPeriodForm(
            period
        );

    };


// ============================================================
// DELETE PERIOD
// ============================================================

window.deletePeriod =
    async function(periodId) {

        if (!timetableState.schoolId) {

            alert(
                "Please select a school first."
            );

            return;
        }


        if (!periodId) {

            alert(
                "Invalid period ID."
            );

            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to delete this period?"
            );


        if (!confirmed) {

            return;
        }


        const {
            error
        } = await supabaseClient

            .from(
                "timetable_periods"
            )

            .delete()

            .eq(
                "id",
                periodId
            )

            .eq(
                "school_id",
                timetableState.schoolId
            );


        if (error) {

            console.error(
                "Delete period error:",
                error
            );


            alert(
                "Failed to delete period:\n\n" +
                error.message
            );

            return;
        }


        alert(
            "Period deleted successfully."
        );


        await loadPeriods();

    };


// ============================================================
// LOAD PERIODS WHEN SCHOOL CHANGES
// ============================================================

if (schoolSelect) {

    schoolSelect.addEventListener(
        "change",
        async function() {

            if (
                timetableState.schoolId
            ) {

                await loadPeriods();

            }

        }
    );

}


// ============================================================
// AUTOMATIC DAY NUMBER
// ============================================================

const periodDayName =
    document.getElementById(
        "periodDayName"
    );

const periodDayNumber =
    document.getElementById(
        "periodDayNumber"
    );


if (
    periodDayName &&
    periodDayNumber
) {

    periodDayName.addEventListener(
        "change",
        function() {

            const dayNumbers = {

                Monday: 1,

                Tuesday: 2,

                Wednesday: 3,

                Thursday: 4,

                Friday: 5,

                Saturday: 6

            };


            const selectedDay =
                this.value;


            const number =
                dayNumbers[
                    selectedDay
                ];


            if (number) {

                periodDayNumber.value =
                    number;

            }


            updatePeriodCalculatedFields();

        }
    );

}


// ============================================================
// AUTOMATIC PERIOD ORDER + NAME
// ============================================================

const periodNumberInput =
    document.getElementById(
        "periodNumber"
    );

const periodOrderInput =
    document.getElementById(
        "periodOrder"
    );

const periodNameInput =
    document.getElementById(
        "periodName"
    );

const periodTypeInput =
    document.getElementById(
        "periodType"
    );


function updatePeriodCalculatedFields() {

    if (
        !periodDayNumber ||
        !periodNumberInput ||
        !periodOrderInput ||
        !periodNameInput ||
        !periodTypeInput
    ) {

        return;
    }


    const dayNumber =
        Number(
            periodDayNumber.value
        ) || 1;


    const periodNumber =
        Number(
            periodNumberInput.value
        ) || 1;


    // --------------------------------------------------------
    // PERIOD ORDER
    // --------------------------------------------------------

    const periodOrder =
        (
            (dayNumber - 1) * 100
        ) +
        periodNumber;


    periodOrderInput.value =
        periodOrder;


    // --------------------------------------------------------
    // PERIOD NAME
    // --------------------------------------------------------

    const type =
        periodTypeInput.value;


    if (
        type === "lesson"
    ) {

        periodNameInput.value =
            `Period ${periodNumber}`;

    }

    else {

        const selectedOption =
            periodTypeInput.options[
                periodTypeInput.selectedIndex
            ];


        if (selectedOption) {

            periodNameInput.value =
                selectedOption.textContent.trim();

        }

    }

}


// ============================================================
// UPDATE WHEN PERIOD NUMBER CHANGES
// ============================================================

if (periodNumberInput) {

    periodNumberInput.addEventListener(
        "input",
        updatePeriodCalculatedFields
    );

}


// ============================================================
// UPDATE WHEN PERIOD TYPE CHANGES
// ============================================================

if (periodTypeInput) {

    periodTypeInput.addEventListener(
        "change",
        updatePeriodCalculatedFields
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
// LOAD CLASSES FOR STREAM FORM
// ============================================================

async function loadStreamClasses() {

    const classSelect =
        document.getElementById(
            "streamClassId"
        );


    // --------------------------------------------------------
    // CHECK ELEMENT
    // --------------------------------------------------------

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
    // LOADING
    // --------------------------------------------------------

    classSelect.innerHTML = `
        <option value="">
            Loading classes...
        </option>
    `;


    console.log(
        "Loading classes for school:",
        timetableState.schoolId
    );


    // --------------------------------------------------------
    // LOAD CLASSES
    // --------------------------------------------------------

    const {
        data,
        error
    } = await supabaseClient

        .from(
            "timetable_classes"
        )

        .select(
            "id, name, grade_id, academic_year"
        )

        .eq(
            "school_id",
            timetableState.schoolId
        )

        .order(
            "name",
            {
                ascending: true
            }
        );


    // --------------------------------------------------------
    // DATABASE ERROR
    // --------------------------------------------------------

    if (error) {

        console.error(
            "Failed to load stream classes:",
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


    // --------------------------------------------------------
    // NO CLASSES
    // --------------------------------------------------------

    if (
        !data ||
        data.length === 0
    ) {

        console.warn(
            "No classes found for school:",
            timetableState.schoolId
        );


        classSelect.innerHTML = `
            <option value="">
                No classes found
            </option>
        `;


        return;

    }


    // --------------------------------------------------------
    // BUILD OPTIONS
    // --------------------------------------------------------

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
                        schoolClass.name
                    )}

                </option>
            `;

        }
    );


    classSelect.innerHTML =
        html;


    console.log(
        "Stream classes loaded:",
        data.length
    );

    console.log(
        "Classes:",
        data
    );

}




// ============================================================
// LOAD STREAMS - DIAGNOSTIC VERSION
// ============================================================

async function loadStreams() {

    const container =
        document.getElementById(
            "streamsTableContainer"
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
            Loading streams...
        </div>
    `;


    // ========================================================
    // LOAD CLASSES
    // ========================================================

    const {
        data: classes,
        error: classError
    } = await supabaseClient

        .from("timetable_classes")

        .select("*")

        .eq(
            "school_id",
            timetableState.schoolId
        );


    console.log(
        "===================================="
    );

    console.log(
        "SCHOOL ID:",
        timetableState.schoolId
    );

    console.log(
        "CLASSES RETURNED:",
        classes
    );

    console.log(
        "CLASS ERROR:",
        classError
    );

    console.log(
        "NUMBER OF CLASSES:",
        classes
            ? classes.length
            : 0
    );


    if (classError) {

        container.innerHTML = `
            <div class="empty-message">

                Class loading error:

                <br><br>

                ${escapeHtml(
                    classError.message
                )}

            </div>
        `;

        return;

    }


    // ========================================================
    // CREATE CLASS MAP
    // ========================================================

    const classMap = {};


    if (classes) {

        classes.forEach(
            schoolClass => {

                console.log(
                    "CLASS:",
                    schoolClass.id,
                    schoolClass.name
                );


                classMap[
                    String(
                        schoolClass.id
                    )
                ] =
                    schoolClass.name;

            }
        );

    }


    console.log(
        "CLASS MAP:",
        classMap
    );


    // ========================================================
    // LOAD STREAMS
    // ========================================================

    const {
        data: streams,
        error: streamError
    } = await supabaseClient

        .from("timetable_streams")

        .select("*")

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


    console.log(
        "STREAMS RETURNED:",
        streams
    );

    console.log(
        "STREAM ERROR:",
        streamError
    );


    if (streamError) {

        container.innerHTML = `
            <div class="empty-message">

                Stream loading error:

                <br><br>

                ${escapeHtml(
                    streamError.message
                )}

            </div>
        `;

        return;

    }


    if (
        !streams ||
        streams.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No streams found.
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


    streams.forEach(
        stream => {

            const streamClassId =
                String(
                    stream.class_id
                );


            const className =
                classMap[
                    streamClassId
                ] ||
                "Unknown Class";


            console.log(
                "STREAM CLASS MATCH:",
                {
                    stream:
                        stream.stream_name,

                    classId:
                        stream.class_id,

                    classIdAsString:
                        streamClassId,

                    matchedClass:
                        className
                }
            );


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
        "FINAL CLASS MAP:",
        classMap
    );

}
// ============================================================
// EDIT STREAM
// ============================================================

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
        async function() {

            if (
                timetableState.schoolId
            ) {

                await loadStreamClasses();

                await loadStreams();

            }

        }
    );

}


// ============================================================
// INITIAL LOAD
// ============================================================

if (
    timetableState.schoolId
) {

    loadStreamClasses();

    loadStreams();

}
initializeApp();
