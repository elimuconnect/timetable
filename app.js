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
// 14. START
// ============================================================

initializeApp();
