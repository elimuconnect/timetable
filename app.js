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


// ============================================================
// 16. LOAD TEACHERS WHEN SCHOOL CHANGES
// ============================================================

// Keep the original school-change functionality,
// then also load the teacher management table.

if (schoolSelect) {

    schoolSelect.addEventListener(
        "change",
        async function () {

            if (
                timetableState.schoolId
            ) {

                await loadTeachers();

            }

        }
    );

}


// ============================================================
// END
// ============================================================


// ============================================================
// 14. START
// ============================================================

initializeApp();
