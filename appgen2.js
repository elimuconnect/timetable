// ============================================================
// SMART TIMETABLE GENERATOR V2
// PART 1 — GENERATOR FOUNDATION
// ============================================================

console.log("======================================");
console.log("SMART TIMETABLE GENERATOR V2");
console.log("PART 1 — FOUNDATION");
console.log("======================================");


// ============================================================
// GENERATOR STATE
// ============================================================

const generatorState = {

    running: false,

    schoolId: null,

    data: {

        requirements: [],
        periods: [],
        streams: [],
        subjects: [],
        teachers: [],
        rooms: []

    }

};


// ============================================================
// STATUS
// ============================================================

function generatorStatus(message) {

    console.log(
        "[TIMETABLE GENERATOR]",
        message
    );

}


// ============================================================
// GET SELECTED SCHOOL
// ============================================================

function getGeneratorSchoolId() {

    if (
        typeof timetableState !== "undefined" &&
        timetableState.schoolId
    ) {

        return timetableState.schoolId;

    }

    return null;

}


// ============================================================
// GENERATE BUTTON
// ============================================================

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
        event.stopPropagation();

        console.log("");
        console.log(
            "======================================"
        );
        console.log(
            "🚀 GENERATE BUTTON CLICKED"
        );
        console.log(
            "======================================"
        );

        generatorState.schoolId =
            getGeneratorSchoolId();

        console.log(
            "School ID:",
            generatorState.schoolId
        );


        if (
            !generatorState.schoolId
        ) {

            console.error(
                "❌ No school selected."
            );

            return;

        }


        if (
            generatorState.running
        ) {

            console.warn(
                "Generator is already running."
            );

            return;

        }


        generatorState.running =
            true;


        try {

            generatorStatus(
                "PART 1 WORKING"
            );

            generatorStatus(
                "Foundation is working correctly."
            );

        }
        catch (error) {

            console.error(
                "GENERATOR ERROR:",
                error
            );

        }
        finally {

            generatorState.running =
                false;

        }

    }
);

// ============================================================
// GENERATION STATUS
// Compatibility function used by app.js
// ============================================================

function hideTimetableGenerationStatus() {

    const status =
        document.getElementById(
            "timetableGenerationStatus"
        );

    if (status) {

        status.style.display = "none";

    }

}

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

    status.textContent =
        message;

    status.style.display =
        "block";

    status.className =
        "timetable-generation-status " +
        type;

}
