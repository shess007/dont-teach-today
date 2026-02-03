// AI Sports Commentator - Commentary Lines Database
// Mix of excited sports broadcaster + witty humor

export const COMMENTARY_DATA = {
    // HIGH PRIORITY - Major game moments
    hit: {
        priority: 'HIGH',
        cooldown: 1500,
        lines: [
            "DIRECT HIT! The teacher is covered in egg!",
            "SPLAT! That's gonna leave a mark!",
            "INCREDIBLE shot by the pupil!",
            "OH! Right on target!",
            "The teacher just got SCRAMBLED!",
            "What a throw! Sunny side DOWN!",
            "BOOM! Egg-cellent accuracy!",
            "That teacher is toast... with egg on it!",
        ],
        // Contextual variants when near goal
        nearGoal: [
            "SO CLOSE to safety - but the egg finds its mark!",
            "Just meters from the school - DENIED!",
            "Heartbreak at the finish line!",
            "The dream dies just steps from glory!",
        ]
    },

    teacherWin: {
        priority: 'HIGH',
        cooldown: 0,
        lines: [
            "TEACHERS WIN! They made it to school!",
            "SAFE! The teachers reach their destination!",
            "Against all odds - TEACHERS VICTORIOUS!",
            "The bell rings for the TEACHERS!",
            "Class is in session! Teachers triumph!",
            "They've done it! Education prevails!",
        ]
    },

    pupilWin: {
        priority: 'HIGH',
        cooldown: 0,
        lines: [
            "TIME'S UP! The pupils hold the line!",
            "PUPILS WIN! No school today!",
            "The defense was IMPENETRABLE!",
            "RECESS FOREVER! Pupils claim victory!",
            "The teachers couldn't crack this defense!",
            "Snow day? No, EGG DAY! Pupils win!",
        ]
    },

    gameStart: {
        priority: 'HIGH',
        cooldown: 0,
        lines: [
            "AND WE'RE OFF! 90 seconds on the clock!",
            "The chase begins! Teachers, RUN!",
            "LET'S GO! The schoolyard showdown starts NOW!",
            "Game on! May the best team win!",
            "The battle for education begins!",
            "Ready, set, SCRAMBLE!",
        ]
    },

    // MEDIUM PRIORITY - Notable tactical moments
    sprint: {
        priority: 'MEDIUM',
        cooldown: 3000,
        lines: [
            "Sprint activated! Look at that speed!",
            "The teacher kicks it into HIGH GEAR!",
            "TURBO MODE engaged!",
            "Running like there's a pop quiz behind them!",
            "They're booking it!",
            "Zoom zoom! Teacher on the move!",
        ]
    },

    throw: {
        priority: 'MEDIUM',
        cooldown: 2000,
        lines: [
            "Egg incoming!",
            "Here it comes!",
            "Watch out below!",
            "Fire in the hole!",
            "Breakfast is served... airmail!",
        ]
    },

    refill: {
        priority: 'MEDIUM',
        cooldown: 3000,
        lines: [
            "Restocking at the coop! Smart play!",
            "Fresh ammunition incoming!",
            "The eggs are replenished!",
            "Back to the chicken for more ammo!",
            "Reloading the egg launcher!",
        ]
    },

    hideInBush: {
        priority: 'MEDIUM',
        cooldown: 5000,
        lines: [
            "The teacher takes cover in the bushes!",
            "A tactical retreat to the foliage!",
            "Hidden from view... for now!",
            "Playing hide and seek, are we?",
            "Stealth mode activated!",
        ]
    },

    // LOW PRIORITY - Status updates and flavor
    timerCritical: {
        priority: 'LOW',
        cooldown: 10000,
        lines: [
            "TEN SECONDS remaining!",
            "Time is running out!",
            "It's now or never for the teachers!",
            "Final countdown! This is INTENSE!",
            "The clock is not their friend!",
        ]
    },

    outOfEggs: {
        priority: 'LOW',
        cooldown: 8000,
        lines: [
            "Out of eggs! Time to refill!",
            "The coop is calling - no ammo left!",
            "Empty-handed! Quick, get more eggs!",
            "Eggless! This could be trouble!",
            "The pantry is empty!",
        ]
    },

    nearMiss: {
        priority: 'LOW',
        cooldown: 3000,
        lines: [
            "JUST missed! Too close for comfort!",
            "INCHES away! What a dodge!",
            "The teacher escapes by a hair!",
            "SO close! The egg just grazes past!",
            "That was close! Almost scrambled!",
            "Whew! That one was a nail-biter!",
        ]
    },

    multiHit: {
        priority: 'HIGH',
        cooldown: 2000,
        lines: [
            "DOUBLE TROUBLE! Both teachers hit!",
            "A two-for-one special!",
            "Synchronized splatting!",
        ]
    },
};

// Priority determines font size and color
export const PRIORITY_CONFIG = {
    HIGH: { fontSize: 36, color: 0xFFFF00 },    // Yellow - critical events
    MEDIUM: { fontSize: 28, color: 0xFFFFFF },  // White - notable events
    LOW: { fontSize: 24, color: 0xCCCCCC },     // Light gray - flavor text
};
