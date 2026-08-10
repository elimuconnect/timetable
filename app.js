// ========================================
// SMART TIMETABLE GENERATOR
// Main JavaScript File
// ========================================


console.log("Smart Timetable Generator started");


// ========================================
// APPLICATION STATE
// ========================================

const appState = {

    teachers: [],

    subjects: [],

    classes: [],

    rooms: [],

    periods: [],

    requirements: []

};


// ========================================
// START SETUP BUTTON
// ========================================

const startBtn =
    document.getElementById("startBtn");

const setupSection =
    document.getElementById("setupSection");


startBtn.addEventListener("click", function () {

    setupSection.classList.remove("hidden");

    setupSection.scrollIntoView({
        behavior: "smooth"
    });

});


// ========================================
// UPDATE DASHBOARD
// ========================================

function updateDashboard() {

    document.getElementById("teacherCount")
        .textContent = appState.teachers.length;

    document.getElementById("subjectCount")
        .textContent = appState.subjects.length;

    document.getElementById("classCount")
        .textContent = appState.classes.length;

    document.getElementById("roomCount")
        .textContent = appState.rooms.length;

}


// ========================================
// INITIALIZE APPLICATION
// ========================================

function initApp() {

    updateDashboard();

    console.log("Application initialized");

}


initApp();
