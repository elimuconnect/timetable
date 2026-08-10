const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ================================
// NAVIGATION
// ================================

document.querySelectorAll(".nav-btn").forEach(button => {

    button.addEventListener("click", () => {

        const sectionName =
            button.dataset.section;

        if (!sectionName) return;

        document
            .querySelectorAll(".section")
            .forEach(section => {
                section.classList.remove("active");
            });

        document
            .querySelectorAll(".nav-btn")
            .forEach(btn => {
                btn.classList.remove("active");
            });

        const target =
            document.getElementById(sectionName);

        if (target) {
            target.classList.add("active");
        }

        button.classList.add("active");

    });

});


// ================================
// LOAD SCHOOLS
// ================================

async function loadSchools() {

    const { data, error } =
        await supabaseClient
            .from("schools")
            .select("id, name")
            .eq("status", "active")
            .order("name");

    if (error) {

        console.error(
            "Failed to load schools:",
            error
        );

        return;

    }


    const select =
        document.getElementById("schoolSelect");

    select.innerHTML =
        `<option value="">
            Select school
        </option>`;


    data.forEach(school => {

        const option =
            document.createElement("option");

        option.value = school.id;

        option.textContent = school.name;

        select.appendChild(option);

    });

}


// ================================
// SCHOOL SELECTION
// ================================

document
    .getElementById("schoolSelect")
    .addEventListener("change", async function () {

        const schoolId = this.value;

        if (!schoolId) {

            document.getElementById(
                "schoolName"
            ).textContent =
                "No school selected";

            return;

        }


        const school =
            this.options[
                this.selectedIndex
            ].textContent;


        document.getElementById(
            "schoolName"
        ).textContent = school;


        await loadDashboardData(
            schoolId
        );

    });


// ================================
// DASHBOARD COUNTS
// ================================

async function loadDashboardData(
    schoolId
) {

    const tables = [
        ["timetable_teachers", "teacherCount"],
        ["timetable_subjects", "subjectCount"],
        ["timetable_streams", "streamCount"],
        ["timetable_rooms", "roomCount"]
    ];


    for (const [table, elementId]
        of tables) {

        const { count, error } =
            await supabaseClient
                .from(table)
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq(
                    "school_id",
                    schoolId
                );


        if (error) {

            console.error(
                `Failed loading ${table}:`,
                error
            );

            continue;

        }


        document.getElementById(
            elementId
        ).textContent =
            count ?? 0;

    }

}


// ================================
// GENERATE BUTTON
// ================================

document
    .getElementById("generateBtn")
    .addEventListener("click", () => {

        const schoolId =
            document.getElementById(
                "schoolSelect"
            ).value;

        if (!schoolId) {

            alert(
                "Please select a school first."
            );

            return;

        }


        alert(
            "The automatic generator will be connected in the next step."
        );

    });


// ================================
// START APPLICATION
// ================================

loadSchools();
