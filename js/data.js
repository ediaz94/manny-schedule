/* =====================================================================
   DATA — Manny's plan, baked in. Plain global object (no build step).
   Everything the app shows lives here. Edit text freely; keep the shape.
   ===================================================================== */
window.DATA = (function () {

  /* ---- Profile -------------------------------------------------------- */
  const profile = {
    name: "Manny",
    partner: "Nicole",
    heightIn: 75,
    startWeight: 240,
    targetWeight: 215,
    weddingDate: "2026-11-06",
    weddingVenue: "Sacred Heart",
    receptionVenue: "Charles H. Morris Center",
    hydrationTargetOz: 120,
    fintechWeeklyHours: 5.5,
    calorieTarget: 2100,
    proteinTarget: 180
  };

  /* ---- Phases --------------------------------------------------------- */
  const phases = [
    { slug: "foundation", name: "Phase 1: Foundation", start: "2026-06-08", end: "2026-07-31",
      goal: "Build the habits. Lose the first 8–10 lbs. Establish the rhythm.",
      workout: "Workouts at recommended weights — focus on form before adding load.",
      fintech: "Paused — the wedding takes priority right now.",
      diet: "Strict on meal prep and lunch packing. This is the highest-leverage habit." },
    { slug: "build", name: "Phase 2: Build", start: "2026-08-01", end: "2026-09-15",
      goal: "Visible composition change. Strength up 15–20% on lifts. Down 15–20 lbs total.",
      workout: "Progress weight steadily. Saturday runs hit the 40-min continuous mark.",
      fintech: "Still paused. Resume only if the wedding load lightens.",
      diet: "Same template; may need to tighten calories slightly. Recalculate at 8 weeks." },
    { slug: "refine", name: "Phase 3: Refine", start: "2026-09-16", end: "2026-10-22",
      goal: "Sharpen physique. Lock in routines. Reduce stress accumulation.",
      workout: "Same volume, less max effort. No new PR attempts — injury risk gets disproportionate.",
      fintech: "Paused. Wedding crunch time — no guilt.",
      diet: "Dialed in (no big indulgences except date nights and family events)." },
    { slug: "taper", name: "Phase 4: Taper", start: "2026-10-23", end: "2026-11-05",
      goal: "Arrive at November 6 rested, hydrated, mentally calm, and looking the way you want.",
      workout: "Reduce intensity 30%. Walks, easy lifts, mobility. No heavy lower body in the last 7 days.",
      fintech: "Pause. Pick back up Nov 9.",
      diet: "Simple and clean. No new foods. Reduce sodium slightly. Hydrate aggressively (120+ oz)." },
    { slug: "wedding-week", name: "Wedding Week", start: "2026-11-01", end: "2026-11-06",
      goal: "Marry Nicole.",
      workout: "Walks only. Last gym session was November 3 (Tuesday).",
      fintech: "Off.",
      diet: "Light meals, hydrate, sleep. No experiments." }
  ];

  /* ---- Block-type icons & labels ------------------------------------- */
  const blockIcon = {
    wake: "💧", meal: "🍽️", prayer: "🙏", commute: "🚗", work: "💼",
    fintech: "📈", workout: "🏋️", "wedding-checkin": "💍", "wedding-block": "💍",
    flex: "⚙️", shower: "🚿", "meal-prep": "🍱", mass: "⛪", rest: "🌙", review: "📊"
  };
  const mealEmojiByTitle = { "Light Breakfast": "🍳", "Grocery Run": "🛒" };

  /* ---- Day templates (the schedule) ---------------------------------- */
  const days = [
    { dow: 1, name: "Monday — Lower Strength", workoutType: "lower-strength", weighIn: false, blocks: [
      { s: "06:15", e: "06:30", type: "wake", title: "Wake & Hydrate", desc: "Water with electrolytes before coffee. Quick scripture or rosary decade. No phone yet." },
      { s: "06:30", e: "06:50", type: "meal", title: "Light Breakfast", desc: "Greek yogurt + berries + nuts, or 2 eggs + 1 slice whole-grain toast. Coffee.", meal: "breakfast" },
      { s: "06:50", e: "07:00", type: "prayer", title: "Morning Prayer with Nicole", desc: "10 minutes together: short scripture, Our Father, intentions for the day.", prayer: "morning" },
      { s: "07:15", e: "07:35", type: "commute", title: "Commute to Work", desc: "Fr. Mike Schmitz, Bible in a Year podcast.", bible: true },
      { s: "07:40", e: "17:00", type: "work", title: "Work at RTSS", desc: "Operations. Use lunch (~12:00–12:45) for the packed meal. Step outside 10 min after eating." },
      { s: "17:00", e: "17:25", type: "commute", title: "Drive to Gym", desc: "Crunch Fitness — Abercorn." },
      { s: "17:30", e: "18:45", type: "workout", title: "Lower Body — Strength", desc: "Goblet squats, RDLs, lunges, leg press, calves, plank. ~55 min." },
      { s: "18:50", e: "19:10", type: "shower", title: "Shower & Reset", desc: "Quick shower. Change. Decompress." },
      { s: "19:10", e: "20:00", type: "meal", title: "Dinner with Nicole", desc: "Cook together when possible. Phones away. Real connection time.", meal: "dinner" },
      { s: "20:30", e: "21:15", type: "flex", title: "Flex Block", desc: "Finamigo client work, wedding to-dos, light home improvement, options review, or rest." },
      { s: "21:15", e: "21:30", type: "rest", title: "Wind Down", desc: "Tomorrow's lunch packed, gym bag set by door, clothes laid out. Dim lights." },
      { s: "21:30", e: "21:45", type: "prayer", title: "Evening Prayer", desc: "Examen with Nicole or alone — review the day, gratitude, intentions.", prayer: "evening" },
      { s: "21:45", e: "21:50", type: "rest", title: "Lights Out", desc: "Phone outside the bedroom or on Do Not Disturb. Cool, dark room." }
    ]},
    { dow: 2, name: "Tuesday — Upper Push + Core", workoutType: "upper-push", weighIn: false, blocks: [
      { s: "06:15", e: "06:30", type: "wake", title: "Wake & Hydrate", desc: "Water with electrolytes. Scripture or rosary decade." },
      { s: "06:30", e: "06:50", type: "meal", title: "Light Breakfast", desc: "Greek yogurt + berries + nuts, or eggs + toast.", meal: "breakfast" },
      { s: "06:50", e: "07:00", type: "prayer", title: "Morning Prayer with Nicole", desc: "10 minutes together.", prayer: "morning" },
      { s: "07:15", e: "07:35", type: "commute", title: "Commute to Work", desc: "Bible in a Year podcast.", bible: true },
      { s: "07:40", e: "17:00", type: "work", title: "Work at RTSS", desc: "Operations." },
      { s: "17:00", e: "17:25", type: "commute", title: "Drive to Gym", desc: "Crunch Fitness." },
      { s: "17:30", e: "18:20", type: "workout", title: "Upper Push + Core", desc: "Bench, shoulder press, incline, triceps, wood chops, knee raises. ~50 min." },
      { s: "18:50", e: "19:10", type: "shower", title: "Shower & Reset", desc: "Quick shower." },
      { s: "19:10", e: "20:00", type: "meal", title: "Dinner with Nicole", desc: "Phones away.", meal: "dinner" },
      { s: "20:00", e: "20:30", type: "wedding-checkin", title: "Wedding Check-in", desc: "30 min focused. Pick top 3 items, knock them out." },
      { s: "20:30", e: "21:15", type: "flex", title: "Flex Block", desc: "Choose: Finamigo, wedding to-dos, hobby, or rest." },
      { s: "21:30", e: "21:45", type: "prayer", title: "Evening Prayer", desc: "Examen.", prayer: "evening" },
      { s: "21:45", e: "21:50", type: "rest", title: "Lights Out", desc: "DND on." }
    ]},
    { dow: 3, name: "Wednesday — Active Recovery", workoutType: "active-recovery", weighIn: false, blocks: [
      { s: "06:15", e: "06:30", type: "wake", title: "Wake & Hydrate", desc: "Water with electrolytes." },
      { s: "06:30", e: "06:50", type: "meal", title: "Light Breakfast", desc: "Greek yogurt or eggs + toast.", meal: "breakfast" },
      { s: "06:50", e: "07:00", type: "prayer", title: "Morning Prayer with Nicole", desc: "10 minutes.", prayer: "morning" },
      { s: "07:15", e: "07:35", type: "commute", title: "Commute to Work", desc: "Bible in a Year podcast.", bible: true },
      { s: "07:40", e: "17:00", type: "work", title: "Work at RTSS", desc: "Operations." },
      { s: "17:00", e: "17:25", type: "commute", title: "Commute Home", desc: "Bible podcast or decompression music." },
      { s: "17:45", e: "18:15", type: "workout", title: "30-min Walk", desc: "Target 3 miles. Conversational pace. Outdoors if weather allows." },
      { s: "18:15", e: "18:30", type: "workout", title: "Mobility Flow", desc: "15 min at home: pigeon, couch stretch, world's greatest stretch, doorway pec stretch, cat-cow." },
      { s: "18:45", e: "19:45", type: "meal", title: "Dinner with Nicole", desc: "Real connection time.", meal: "dinner" },
      { s: "20:00", e: "21:15", type: "flex", title: "Flex / Rest", desc: "Bookkeeping, reading, or genuine rest." },
      { s: "21:30", e: "21:45", type: "prayer", title: "Evening Prayer", desc: "Examen.", prayer: "evening" },
      { s: "21:45", e: "21:50", type: "rest", title: "Lights Out", desc: "" }
    ]},
    { dow: 4, name: "Thursday — Lower Volume + Mobility", workoutType: "lower-volume", weighIn: false, blocks: [
      { s: "06:15", e: "06:30", type: "wake", title: "Wake & Hydrate", desc: "Water with electrolytes." },
      { s: "06:30", e: "06:50", type: "meal", title: "Light Breakfast", desc: "Greek yogurt or eggs.", meal: "breakfast" },
      { s: "06:50", e: "07:00", type: "prayer", title: "Morning Prayer with Nicole", desc: "10 minutes.", prayer: "morning" },
      { s: "07:15", e: "07:35", type: "commute", title: "Commute to Work", desc: "Bible in a Year podcast.", bible: true },
      { s: "07:40", e: "17:00", type: "work", title: "Work at RTSS", desc: "Operations." },
      { s: "17:00", e: "17:25", type: "commute", title: "Drive to Gym", desc: "Crunch Fitness." },
      { s: "17:30", e: "18:30", type: "workout", title: "Lower Body — Volume + Mobility", desc: "Bulgarian split squats, step-ups, hip thrusts, leg curls, Cossack squats, 20-min mobility. ~60 min." },
      { s: "18:50", e: "19:10", type: "shower", title: "Shower & Reset", desc: "Quick shower." },
      { s: "19:10", e: "20:00", type: "meal", title: "Dinner with Nicole", desc: "Phones away.", meal: "dinner" },
      { s: "20:00", e: "20:30", type: "wedding-checkin", title: "Wedding Check-in", desc: "30 min focused." },
      { s: "20:30", e: "21:15", type: "flex", title: "Flex Block", desc: "Choose." },
      { s: "21:30", e: "21:45", type: "prayer", title: "Evening Prayer", desc: "Examen.", prayer: "evening" },
      { s: "21:45", e: "21:50", type: "rest", title: "Lights Out", desc: "" }
    ]},
    { dow: 5, name: "Friday — Upper Pull + Core (Weigh-in)", workoutType: "upper-pull", weighIn: true, blocks: [
      { s: "06:15", e: "06:30", type: "wake", title: "Weigh-in + Wake", desc: "Step on the scale post-bathroom, pre-coffee. Log it. Then hydrate.", weighIn: true },
      { s: "06:30", e: "06:50", type: "meal", title: "Light Breakfast", desc: "Greek yogurt or eggs.", meal: "breakfast" },
      { s: "06:50", e: "07:00", type: "prayer", title: "Morning Prayer with Nicole", desc: "10 minutes.", prayer: "morning" },
      { s: "07:15", e: "07:35", type: "commute", title: "Commute to Work", desc: "Bible podcast.", bible: true },
      { s: "07:40", e: "17:00", type: "work", title: "Work at RTSS", desc: "Operations." },
      { s: "17:00", e: "17:25", type: "commute", title: "Drive to Gym", desc: "Crunch Fitness." },
      { s: "17:30", e: "18:15", type: "workout", title: "Upper Pull + Core", desc: "Lat pulldowns, rows, face pulls, curls, dead bug, side plank. ~45 min." },
      { s: "18:50", e: "19:10", type: "shower", title: "Shower & Reset", desc: "Quick shower." },
      { s: "19:10", e: "20:00", type: "meal", title: "Dinner with Nicole", desc: "Friday — make it a good cook.", meal: "dinner" },
      { s: "20:30", e: "21:15", type: "flex", title: "Flex / Relax", desc: "Optional weekend date night start or genuine rest." },
      { s: "21:30", e: "21:45", type: "prayer", title: "Evening Prayer", desc: "Examen.", prayer: "evening" },
      { s: "21:45", e: "21:50", type: "rest", title: "Lights Out", desc: "" }
    ]},
    { dow: 6, name: "Saturday — Long Run + Prep + Wedding", workoutType: "long-run", weighIn: false, blocks: [
      { s: "07:00", e: "07:30", type: "wake", title: "Slow Wake", desc: "Sleep in a little. Light breakfast. Morning prayer.", prayer: "morning" },
      { s: "07:30", e: "09:00", type: "workout", title: "Long Run / Conditioning", desc: "60–75 min. Steady-state + posterior chain. Saturday is your big fitness highlight." },
      { s: "09:00", e: "09:45", type: "meal", title: "Shower + Breakfast #2", desc: "Post-workout: eggs, oats, fruit.", meal: "breakfast" },
      { s: "09:45", e: "10:30", type: "meal-prep", title: "Grocery Run", desc: "Aldi (14070 Abercorn) first — $60–80 staples. Then Publix (11701 Abercorn) — $30–50 produce/fish.", grocery: true },
      { s: "10:30", e: "12:00", type: "meal-prep", title: "Meal Prep", desc: "90 min — roast veg, cook proteins, portion 5 lunches.", prep: true },
      { s: "12:00", e: "13:30", type: "meal", title: "Lunch + Decompress", desc: "With Nicole.", meal: "lunch" },
      { s: "13:30", e: "15:30", type: "wedding-block", title: "Wedding Power Block", desc: "Big weekly push with Nicole. Vendors, RSVPs, timeline, in memoriam, payments." },
      { s: "15:30", e: "17:30", type: "flex", title: "Flex Block", desc: "Home improvement, Finamigo client work, options research, or rest." },
      { s: "17:30", e: "22:00", type: "meal", title: "Date Night or Low-Key Evening", desc: "Plan one Saturday per month as a real date night.", dateNight: true },
      { s: "22:00", e: "22:05", type: "rest", title: "Lights Out", desc: "" }
    ]},
    { dow: 0, name: "Sunday — Mass + Rest", workoutType: null, weighIn: false, blocks: [
      { s: "07:30", e: "08:30", type: "wake", title: "Slow Wake", desc: "Coffee, light breakfast." },
      { s: "08:30", e: "09:30", type: "flex", title: "Light Reading", desc: "Bible or a book." },
      { s: "09:30", e: "10:15", type: "commute", title: "Drive to Pooler", desc: "~25 min to Corpus Christi Catholic Church." },
      { s: "10:30", e: "12:00", type: "mass", title: "Mass at Corpus Christi", desc: "1745 Benton Blvd, Pooler.", mass: true },
      { s: "12:00", e: "13:30", type: "meal", title: "Brunch / Lunch", desc: "At home or out occasionally.", meal: "lunch" },
      { s: "13:30", e: "16:00", type: "flex", title: "Family Time / Rest", desc: "Family time, nap, or low-key activity with Nicole." },
      { s: "16:00", e: "17:30", type: "meal-prep", title: "Light Meal Prep", desc: "Finish anything from Saturday, prep Monday's lunch.", prep: true },
      { s: "17:30", e: "19:00", type: "meal", title: "Dinner — Real Cook", desc: "Meat preparations, pan sauces.", meal: "dinner" },
      { s: "19:00", e: "19:15", type: "review", title: "Weekly Review", desc: "5 minutes. Be honest.", review: true },
      { s: "19:15", e: "21:00", type: "rest", title: "Full Rest", desc: "Book, movie, no work." },
      { s: "21:30", e: "21:35", type: "rest", title: "Lights Out", desc: "Back on weekday sleep schedule." }
    ]}
  ];

  /* ---- Workouts (enriched: starting weights, form cues, demo videos) -- */
  const demo = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent("how to " + q + " proper form");
  const workouts = [
    { type: "lower-strength", name: "Lower Body — Strength", dow: 1, minutes: 55,
      warmup: "5 min stationary bike or rower at easy pace, then 5 min dynamic stretching (leg swings, walking lunges, hip circles).",
      cooldown: "5 min stretching (hamstrings, hip flexors, calves).",
      exercises: [
        { name: "Goblet Squat", sets: 4, reps: "8", start: "40 lb dumbbell", notes: "Focus on depth and control.",
          cues: ["Hold the dumbbell at your chest, elbows tucked.", "Sit straight down between your knees, chest tall.", "Drive through mid-foot; knees track over toes."], demo: demo("goblet squat") },
        { name: "Romanian Deadlift", sets: 4, reps: "8", start: "95 lb barbell (or 35 lb dumbbells)", notes: "Dumbbell or barbell.",
          cues: ["Soft knees, push hips back — not a squat.", "Bar/dumbbells stay close to your legs.", "Feel the stretch in your hamstrings, then squeeze glutes up."], demo: demo("romanian deadlift dumbbell") },
        { name: "Walking Lunges", sets: 3, reps: "10 / leg", start: "Bodyweight, then 20 lb dumbbells", notes: null,
          cues: ["Long step, drop the back knee toward the floor.", "Front shin stays vertical.", "Push through the front heel to stand."], demo: demo("walking lunges") },
        { name: "Leg Press", sets: 3, reps: "10", start: "180 lb (machine, moderate)", notes: "Machine, moderate load.",
          cues: ["Feet shoulder-width on the platform.", "Lower until knees ~90°, don't let lower back round.", "Don't lock the knees hard at the top."], demo: demo("leg press machine") },
        { name: "Standing Calf Raise", sets: 3, reps: "15", start: "90 lb (machine) or bodyweight", notes: null,
          cues: ["Rise all the way onto your toes.", "Pause 1 sec at the top.", "Lower slowly for a full stretch."], demo: demo("standing calf raise") },
        { name: "Plank", sets: 3, reps: "45 sec", start: "Bodyweight", notes: null,
          cues: ["Forearms down, elbows under shoulders.", "Squeeze glutes; flat line head to heels.", "Don't let hips sag or pike up."], demo: demo("forearm plank") }
      ]},
    { type: "upper-push", name: "Upper Push + Core", dow: 2, minutes: 50,
      warmup: "5 min easy cardio + arm circles, band pull-aparts.",
      cooldown: "5 min chest/shoulder stretching.",
      exercises: [
        { name: "Dumbbell Bench Press", sets: 4, reps: "8", start: "40 lb dumbbells", notes: null,
          cues: ["Slight arch, shoulder blades pinched down.", "Lower to mid-chest, elbows ~45°.", "Press up and slightly together."], demo: demo("dumbbell bench press") },
        { name: "Seated Shoulder Press", sets: 3, reps: "10", start: "30 lb dumbbells", notes: "Dumbbell.",
          cues: ["Start at ear height, palms forward.", "Press up without flaring elbows behind you.", "Keep ribs down, don't arch the lower back."], demo: demo("seated dumbbell shoulder press") },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10", start: "35 lb dumbbells", notes: "Helps lift the chest visually.",
          cues: ["Bench at ~30°.", "Lower to upper chest.", "Control the negative — no bouncing."], demo: demo("incline dumbbell press") },
        { name: "Tricep Rope Pushdown", sets: 3, reps: "12", start: "40 lb (cable)", notes: null,
          cues: ["Elbows pinned to your sides.", "Push down and spread the rope at the bottom.", "Slow return, keep tension."], demo: demo("tricep rope pushdown") },
        { name: "Cable Wood Chops", sets: 3, reps: "12 / side", start: "25 lb (cable)", notes: "Oblique work for midsection.",
          cues: ["Pull from high to low across your body.", "Rotate through your trunk, arms stay fairly straight.", "Controlled — this is core work, not a swing."], demo: demo("cable woodchop") },
        { name: "Hanging Knee Raise", sets: 3, reps: "12", start: "Bodyweight", notes: "Or Captain's Chair.",
          cues: ["Hang (or brace in the chair) without swinging.", "Curl knees up toward your chest.", "Lower slowly — don't drop."], demo: demo("hanging knee raise") }
      ]},
    { type: "active-recovery", name: "Active Recovery", dow: 3, minutes: 45,
      warmup: "None — this is the warm-up itself.", cooldown: "None.",
      exercises: [
        { name: "30 min Walk", sets: 1, reps: "3 miles", start: "—", notes: "Conversational pace. Outdoors if weather allows.",
          cues: ["Easy nose-breathing pace.", "Relaxed shoulders, brisk but not strained."], demo: demo("brisk walking form") },
        { name: "Pigeon Pose", sets: 3, reps: "45 sec / side", start: "Bodyweight", notes: "Mobility flow.",
          cues: ["Front shin angled, back leg long.", "Square the hips; breathe into the stretch.", "Stop short of pain."], demo: demo("pigeon pose stretch") },
        { name: "Couch Stretch", sets: 3, reps: "45 sec / side", start: "Bodyweight", notes: null,
          cues: ["Back foot up a wall/couch, front foot planted.", "Squeeze the glute of the back leg.", "Tall torso — opens the hip flexor."], demo: demo("couch stretch hip flexor") },
        { name: "World's Greatest Stretch", sets: 3, reps: "5 / side", start: "Bodyweight", notes: null,
          cues: ["Lunge, drop the same-side elbow toward the floor.", "Rotate the opposite arm to the ceiling.", "Move slowly, breathe."], demo: demo("worlds greatest stretch") },
        { name: "Doorway Pec Stretch", sets: 3, reps: "45 sec", start: "Bodyweight", notes: null,
          cues: ["Forearms on the doorframe, step through.", "Feel the chest open.", "Keep ribs down."], demo: demo("doorway pec stretch") },
        { name: "Cat-Cow", sets: 3, reps: "8 reps", start: "Bodyweight", notes: null,
          cues: ["On all fours, alternate arching and rounding.", "Move with your breath.", "Gentle — mobilize the whole spine."], demo: demo("cat cow stretch") }
      ]},
    { type: "lower-volume", name: "Lower Body — Volume + Mobility", dow: 4, minutes: 60,
      warmup: "5 min bike + dynamic stretching.", cooldown: "Included in 20-min mobility flow at the end.",
      exercises: [
        { name: "Bulgarian Split Squat", sets: 3, reps: "10 / leg", start: "Bodyweight, then 20 lb dumbbells", notes: "Huge for proportion and balance.",
          cues: ["Back foot elevated on a bench.", "Drop straight down, front knee over mid-foot.", "Most of the weight in the front leg."], demo: demo("bulgarian split squat") },
        { name: "Step-Ups", sets: 3, reps: "12 / leg", start: "Bodyweight, then 20 lb dumbbells", notes: "Box or bench.",
          cues: ["Whole foot on the box.", "Drive through the top foot — don't push off the floor.", "Control the way down."], demo: demo("dumbbell step ups") },
        { name: "Glute Bridge / Hip Thrust", sets: 4, reps: "12", start: "Bodyweight, then 95 lb barbell", notes: null,
          cues: ["Shoulders on the bench, chin tucked.", "Drive hips up, squeeze glutes hard at the top.", "Ribs down — don't arch the back to fake height."], demo: demo("barbell hip thrust") },
        { name: "Leg Curl", sets: 3, reps: "12", start: "70 lb (machine)", notes: "Machine.",
          cues: ["Pad just above the heels.", "Curl fully, squeeze the hamstrings.", "Slow on the way back."], demo: demo("seated leg curl machine") },
        { name: "Goblet Cossack Squat", sets: 3, reps: "8 / side", start: "20 lb dumbbell", notes: "Mobility + adductors.",
          cues: ["Wide stance, shift to one bent leg.", "Other leg stays straight, toes up.", "Stay tall through the chest."], demo: demo("cossack squat") },
        { name: "Mobility Flow (20 min)", sets: 1, reps: "20 min", start: "—", notes: "Deep squat hold, 90/90 hip switches, hamstring scoops, thoracic openers.",
          cues: ["Move slowly through each position.", "Breathe into tight spots.", "Quality over speed."], demo: demo("hip mobility flow follow along") }
      ]},
    { type: "upper-pull", name: "Upper Pull + Core", dow: 5, minutes: 45,
      warmup: "5 min cardio + scapular work (band pull-aparts).", cooldown: "5 min lat + bicep stretches.",
      exercises: [
        { name: "Lat Pulldown", sets: 4, reps: "10", start: "100 lb (machine)", notes: null,
          cues: ["Slight lean back, chest up.", "Pull the bar to your collarbone, lead with elbows.", "Control it back up — full stretch."], demo: demo("lat pulldown") },
        { name: "Seated Cable Row", sets: 4, reps: "10", start: "100 lb (cable)", notes: null,
          cues: ["Tall torso, pull to your belly button.", "Squeeze shoulder blades together.", "Don't yank with your lower back."], demo: demo("seated cable row") },
        { name: "Face Pull", sets: 3, reps: "15", start: "30 lb (cable)", notes: "Rear delts, posture work.",
          cues: ["Rope at face height.", "Pull toward your forehead, hands split apart.", "Squeeze the rear delts; light weight, high reps."], demo: demo("face pull") },
        { name: "Dumbbell Curl", sets: 3, reps: "12", start: "25 lb dumbbells", notes: null,
          cues: ["Elbows pinned at your sides.", "Curl without swinging.", "Lower slowly under control."], demo: demo("dumbbell bicep curl") },
        { name: "Dead Bug", sets: 3, reps: "10 / side", start: "Bodyweight", notes: null,
          cues: ["On your back, arms up, knees at 90°.", "Lower opposite arm + leg slowly.", "Press lower back flat into the floor the whole time."], demo: demo("dead bug exercise") },
        { name: "Side Plank", sets: 3, reps: "30 sec / side", start: "Bodyweight", notes: null,
          cues: ["Elbow under shoulder.", "Hips stacked and lifted in a straight line.", "Don't let the bottom hip sag."], demo: demo("side plank") }
      ]},
    { type: "long-run", name: "Long Run / Conditioning", dow: 6, minutes: 75,
      warmup: "5 min easy walk + dynamic stretches.", cooldown: "10 min posterior chain finish.",
      exercises: [
        { name: "Cardio Block", sets: 1, reps: "25–50 min", start: "—",
          notes: "Phase 1 (wks 1–4): 25–35 min walk/jog intervals. Phase 2: 30–40 min continuous easy jog. Phase 3: 40–50 min steady zone 2.",
          cues: ["Keep it conversational — you should be able to talk.", "Build time before speed.", "Land softly, relaxed stride."], demo: demo("zone 2 easy running") },
        { name: "Kettlebell Swings", sets: 3, reps: "15", start: "35 lb kettlebell", notes: "Posterior chain finisher.",
          cues: ["Hinge at the hips, not a squat.", "Snap the hips to float the bell to chest height.", "Flat back, the power comes from your glutes."], demo: demo("kettlebell swing") },
        { name: "Bird Dog", sets: 3, reps: "10 / side", start: "Bodyweight", notes: null,
          cues: ["On all fours, extend opposite arm + leg.", "Keep hips level — no twisting.", "Pause, then switch slowly."], demo: demo("bird dog exercise") }
      ]}
  ];

  /* ---- Meals ---------------------------------------------------------- */
  const meals = [
    { type: "breakfast", time: "05:30", label: "Breakfast",
      desc: "Greek yogurt bowl: 1 cup plain Greek yogurt, ½ cup berries, 2 tbsp almonds, drizzle of honey. Coffee.",
      alt: "2 eggs + 1 slice sourdough + ½ avocado", cal: 350, protein: 30 },
    { type: "mid-morning", time: "09:30", label: "Mid-Morning Snack",
      desc: "Apple + 1 tbsp peanut butter", alt: "Hard-boiled egg + handful of almonds", cal: 200, protein: 8 },
    { type: "lunch", time: "12:00", label: "Lunch (prepped)",
      desc: "5–6 oz grilled chicken or turkey, 1 cup quinoa or brown rice, 2 cups roasted veg, olive oil + lemon.",
      alt: null, cal: 550, protein: 45 },
    { type: "pre-workout", time: "17:00", label: "Pre-Workout",
      desc: "Banana + scoop of whey protein in water", alt: "Rice cake with peanut butter", cal: 200, protein: 25 },
    { type: "dinner", time: "19:15", label: "Dinner",
      desc: "Protein (8 oz) + 2 cups vegetables + smart carb. See dinner rotation.", alt: null, cal: 650, protein: 50 },
    { type: "optional-snack", time: "20:30", label: "Optional Snack",
      desc: "Cottage cheese (¾ cup) with berries", alt: "Casein protein shake", cal: 150, protein: 20 }
  ];

  /* ---- Dinner rotation WITH FULL RECIPES ------------------------------ */
  const dinners = [
    { name: "Pan-Seared Chicken Thighs", dow: 1, blurb: "with Dijon-thyme pan sauce, roasted broccoli & sweet potato", defrost: "chicken thighs",
      ingredients: ["4 bone-in or boneless chicken thighs", "Salt & pepper", "1 tbsp olive oil", "1 tbsp butter",
        "½ cup chicken stock", "1 tbsp Dijon mustard", "2 sprigs fresh thyme (or ½ tsp dried)", "1 head broccoli, cut into florets", "1 medium sweet potato"],
      steps: [
        "Heat oven to 425°F. Toss broccoli and cubed sweet potato with olive oil, salt, pepper; roast 25 min.",
        "Pat thighs dry, season both sides with salt and pepper.",
        "Heat 1 tbsp oil in a skillet over medium-high. Sear thighs skin-down 6–7 min until golden, flip, cook 5–6 min more to 175°F. Remove.",
        "Lower heat. Add chicken stock, Dijon, and thyme; scrape up the browned bits. Simmer 2 min.",
        "Off heat, swirl in 1 tbsp butter until glossy. Spoon over the chicken.",
        "Plate with the roasted broccoli and sweet potato."],
      time: "35 min", protein: "~45 g" },
    { name: "Reverse-Seared Steak", dow: 2, blurb: "with chimichurri, arugula salad & roasted potatoes", defrost: "steak",
      ingredients: ["1 sirloin or flank steak (~1 lb)", "Salt & pepper", "Baby potatoes, halved", "Olive oil",
        "Arugula", "Chimichurri: ½ cup parsley, 2 cloves garlic, 2 tbsp red wine vinegar, ⅓ cup olive oil, pinch chili flakes & salt"],
      steps: [
        "Heat oven to 275°F. Salt the steak generously. Roast on a rack 20–30 min until internal temp hits 115°F.",
        "Meanwhile, toss potatoes in oil + salt and roast at 425°F (separate pan) ~30 min.",
        "Chop parsley + garlic fine; mix with vinegar, oil, chili, salt to make chimichurri.",
        "Get a skillet screaming hot. Sear the rested steak 45–60 sec per side for a deep crust.",
        "Rest 5 min, slice against the grain.",
        "Serve over arugula with potatoes; spoon chimichurri over the top."],
      time: "45 min", protein: "~50 g" },
    { name: "Salmon with Lemon-Caper Butter", dow: 3, blurb: "with asparagus & farro", defrost: "salmon fillets",
      ingredients: ["2 salmon fillets", "Salt & pepper", "1 tbsp olive oil", "2 tbsp butter", "1 lemon (juice + zest)",
        "1 tbsp capers", "1 bunch asparagus", "1 cup cooked farro"],
      steps: [
        "Cook farro per package (~25 min) if not already prepped.",
        "Pat salmon dry, season. Heat oil in a skillet over medium-high.",
        "Sear salmon skin-down 4 min, flip, 2–3 min more until just cooked. Remove.",
        "Add asparagus to the pan with a pinch of salt; sauté 4–5 min until tender-crisp.",
        "Lower heat, add butter, lemon juice, zest, and capers; swirl into a quick sauce.",
        "Plate salmon over farro with asparagus; spoon the lemon-caper butter over."],
      time: "30 min", protein: "~40 g" },
    { name: "Shrimp + Andouille Skillet", dow: 4, blurb: "with peppers, onions & cauliflower rice (Cajun nod)", defrost: "shrimp",
      ingredients: ["1 lb shrimp, peeled", "6 oz andouille sausage, sliced", "1 bell pepper, sliced", "1 onion, sliced",
        "2 cups cauliflower rice", "1 tbsp olive oil", "1–2 tsp Cajun seasoning", "Salt to taste"],
      steps: [
        "Heat oil in a large skillet over medium-high. Brown the andouille slices, ~3 min; push aside.",
        "Add peppers and onion; sauté 5 min until softening.",
        "Toss shrimp with Cajun seasoning, add to the pan; cook 2–3 min until pink.",
        "Add cauliflower rice, stir, cook 3–4 min until tender.",
        "Taste, adjust salt and Cajun heat. Serve hot."],
      time: "25 min", protein: "~45 g" },
    { name: "Turkey Meatballs", dow: 5, blurb: "in tomato sauce over zucchini noodles or pasta", defrost: "ground turkey",
      ingredients: ["1 lb ground turkey", "1 egg", "⅓ cup breadcrumbs", "2 cloves garlic, minced", "Salt, pepper, Italian herbs",
        "1 jar (or 2 cups) tomato sauce", "Fresh basil", "2 zucchini spiralized (or a small portion of pasta)"],
      steps: [
        "Mix turkey, egg, breadcrumbs, garlic, salt, pepper, and herbs. Roll into ~16 meatballs.",
        "Brown meatballs in an oiled skillet over medium, turning, ~6 min.",
        "Pour in tomato sauce, cover, simmer 12–15 min until meatballs are cooked through.",
        "Sauté zucchini noodles 2–3 min (or boil pasta).",
        "Serve meatballs and sauce over the noodles; top with torn basil."],
      time: "35 min", protein: "~45 g" },
    { name: "Pork Tenderloin", dow: 6, blurb: "apple-Dijon pan sauce, roasted Brussels sprouts & quinoa", defrost: "pork tenderloin",
      ingredients: ["1 pork tenderloin (~1 lb)", "Salt & pepper", "1 tbsp olive oil", "1 apple, diced", "1 tbsp Dijon",
        "½ cup chicken stock", "1 tbsp butter", "1 lb Brussels sprouts, halved", "1 cup cooked quinoa"],
      steps: [
        "Heat oven to 425°F. Toss Brussels sprouts in oil + salt; roast 25 min, cut-side down.",
        "Season tenderloin. Sear in an oven-safe skillet over medium-high on all sides, ~5 min.",
        "Transfer skillet to the oven; roast 12–15 min to 145°F. Rest the pork on a board.",
        "In the same skillet, sauté apple 2 min; add Dijon + stock, simmer 3 min, swirl in butter.",
        "Slice the pork, spoon the apple-Dijon sauce over. Serve with sprouts and quinoa."],
      time: "40 min", protein: "~45 g" },
    { name: "Carne Asada Tacos", dow: 0, blurb: "corn tortillas, cabbage slaw, avocado, lime", defrost: "flank steak (start the marinade too)",
      ingredients: ["1 lb flank or skirt steak", "Marinade: ¼ cup lime juice, 2 cloves garlic, ¼ cup cilantro, 1 tbsp oil, salt, cumin",
        "Corn tortillas", "2 cups shredded cabbage", "1 avocado", "Lime wedges", "Extra cilantro"],
      steps: [
        "Blend marinade; coat the steak and rest 30 min (or overnight).",
        "Get a grill or cast-iron pan very hot. Cook the steak 3–4 min per side for medium.",
        "Rest 5 min, then slice thin against the grain and chop.",
        "Warm the tortillas in a dry pan.",
        "Build tacos: steak, cabbage, avocado slices, cilantro, a big squeeze of lime."],
      time: "30 min (+ marinade)", protein: "~40 g" }
  ];

  /* ---- Meal-prep workflow (Saturday) — step-by-step ------------------- */
  const mealPrepTasks = [
    { title: "Roast 2 sheet pans of vegetables", desc: "Broccoli, Brussels sprouts, peppers, onions. Toss with olive oil, salt, pepper, garlic powder. 425°F for 25 min." },
    { title: "Cook 3 lbs of chicken in bulk", desc: "Half Mediterranean (oregano, lemon, garlic), half Latin (cumin, chili, lime) to avoid flavor fatigue. Grill, pan-sear, or oven-bake to 165°F." },
    { title: "Cook grain", desc: "2 cups dry quinoa or brown rice (yields ~6 cups cooked). Salt the water." },
    { title: "Hard-boil 6 eggs", desc: "12 min in boiling water, then ice bath. Grab-and-go snacks." },
    { title: "Portion into 5 lunch containers", desc: "Protein + grain + veg in each. Drizzle olive oil + lemon when reheating." },
    { title: "Wash & chop fresh produce", desc: "For the week's snacks and dinner cooks. Store in airtight containers." }
  ];

  /* ---- Grocery staples ----------------------------------------------- */
  const grocery = {
    aldi: [
      { name: "Chicken breast or thighs (5 lb pack)", cat: "protein" },
      { name: "Lean ground turkey (2 lb)", cat: "protein" },
      { name: "Eggs (2 dozen)", cat: "protein" },
      { name: "Plain Greek yogurt (32 oz tub)", cat: "dairy" },
      { name: "Rolled oats", cat: "grain" },
      { name: "Brown rice or quinoa", cat: "grain" },
      { name: "Sweet potatoes", cat: "produce" },
      { name: "Regular potatoes", cat: "produce" },
      { name: "Frozen broccoli", cat: "frozen" },
      { name: "Frozen Brussels sprouts", cat: "frozen" },
      { name: "Frozen mixed berries", cat: "frozen" },
      { name: "Almonds", cat: "snack" },
      { name: "Natural peanut butter", cat: "snack" },
      { name: "Olive oil", cat: "pantry" },
      { name: "Black beans (canned)", cat: "pantry" },
      { name: "Canned tomatoes", cat: "pantry" },
      { name: "Sourdough or whole-grain bread", cat: "grain" }
    ],
    publix: [
      { name: "Fresh asparagus", cat: "produce" },
      { name: "Spinach", cat: "produce" },
      { name: "Bell peppers", cat: "produce" },
      { name: "Avocados", cat: "produce" },
      { name: "Fresh parsley", cat: "produce" },
      { name: "Fresh cilantro", cat: "produce" },
      { name: "Fresh thyme", cat: "produce" },
      { name: "Salmon or shrimp (fresh, for one dinner)", cat: "seafood" },
      { name: "Date-night steak cut (if applicable)", cat: "protein" }
    ]
  };

  /* ---- Fintech modules + milestones ---------------------------------- */
  const fintechModules = [
    { id: "sql", name: "SQL" },
    { id: "power-bi", name: "Power BI" },
    { id: "cfi-ftip", name: "CFI FTIP" },
    { id: "wharton-fintech", name: "Wharton Fintech" },
    { id: "datacamp-ai", name: "DataCamp AI" },
    { id: "applied-project", name: "Applied Project" },
    { id: "other", name: "Other" }
  ];
  const fintechMilestones = [
    { module: "sql", title: "Complete SQL fundamentals course", desc: "Joins, subqueries, window functions, CTEs." },
    { module: "sql", title: "Build SQL portfolio project", desc: "Real-world analysis using a financial dataset." },
    { module: "power-bi", title: "Power BI fundamentals", desc: "Data modeling, DAX basics, visualization design." },
    { module: "power-bi", title: "Build a financial dashboard", desc: "Interactive dashboard using sample/real data." },
    { module: "cfi-ftip", title: "CFI FTIP Module 1: Intro to Fintech", desc: "" },
    { module: "cfi-ftip", title: "CFI FTIP Module 2: Digital Banking & Lending", desc: "" },
    { module: "cfi-ftip", title: "CFI FTIP Module 3: Wealth Management Tech", desc: "" },
    { module: "cfi-ftip", title: "CFI FTIP Module 4: Payments & Cryptocurrency", desc: "" },
    { module: "cfi-ftip", title: "CFI FTIP Final Certification Exam", desc: "" },
    { module: "wharton-fintech", title: "Wharton Course 1: Fintech Foundations", desc: "" },
    { module: "wharton-fintech", title: "Wharton Course 2: Payment Innovations", desc: "" },
    { module: "wharton-fintech", title: "Wharton Course 3: Lending, Crowdfunding & Investment", desc: "" },
    { module: "wharton-fintech", title: "Wharton Course 4: Cryptocurrency & Blockchain", desc: "" },
    { module: "wharton-fintech", title: "Wharton Specialization Capstone", desc: "" },
    { module: "datacamp-ai", title: "DataCamp: AI Fundamentals for Finance", desc: "" },
    { module: "datacamp-ai", title: "DataCamp: Applied ML in Finance", desc: "" }
  ];

  /* ---- Wedding tasks -------------------------------------------------- */
  const weddingTasks = [
    { t: "Finalize all vendor contracts", d: "Review and sign any outstanding vendor contracts.", m: "june", who: "both", p: "high" },
    { t: "Confirm Father Pablo Migone for ceremony", d: "Final confirmation with officiant; exchange contact for rehearsal scheduling.", m: "june", who: "manny", p: "high" },
    { t: "Lock DJ LAGOMARU final details", d: "Confirm timeline, song requests, do-not-play list. Contract $1,350.", m: "june", who: "both", p: "medium" },
    { t: "Close out trolley quotes", d: "Pick a trolley company for guest transfers Sacred Heart → Charles H. Morris Center.", m: "june", who: "manny", p: "high" },
    { t: "Send save-the-date reminders if not done", d: "Last call for any missing addresses.", m: "june", who: "nicole", p: "medium" },
    { t: "Purchase bridal party gifts", d: "Or finalize designs if custom.", m: "june", who: "both", p: "low" },
    { t: "Catering tasting (if not done)", d: "Final menu confirmation.", m: "july", who: "both", p: "high" },
    { t: "Cake tasting", d: "Choose baker and finalize design.", m: "july", who: "both", p: "medium" },
    { t: "Florals walkthrough", d: "Confirm arrangements, centerpieces, ceremony pieces.", m: "july", who: "nicole", p: "medium" },
    { t: "Finalize invitation suite and mail", d: "8–10 weeks out is standard; earlier is better. Track addresses.", m: "july", who: "nicole", p: "high" },
    { t: "Begin tracking RSVPs", d: "Set up RSVP spreadsheet or use website.", m: "july", who: "nicole", p: "medium" },
    { t: "Confirm bridal party attire", d: "Bridesmaids dresses, groomsmen suits/tuxes.", m: "august", who: "both", p: "high" },
    { t: "Schedule tuxedo fittings", d: "For groom and groomsmen.", m: "august", who: "manny", p: "high" },
    { t: "Honeymoon final booking", d: "Flights, accommodations, activities.", m: "august", who: "manny", p: "high" },
    { t: "Hair/makeup trial for Nicole", d: "", m: "august", who: "nicole", p: "medium" },
    { t: "Confirm Airbnb near Forsyth Park for Nov 5–7", d: "", m: "august", who: "manny", p: "high" },
    { t: "In memoriam: collect remaining photos", d: "Including grandparents' wedding photos. 14+ frames total.", m: "august", who: "both", p: "medium" },
    { t: "RSVPs close", d: "Final headcount captured.", m: "september", who: "nicole", p: "high" },
    { t: "Final headcount to caterer", d: "", m: "september", who: "manny", p: "high" },
    { t: "Seating chart drafted", d: "Coordinator can take over comms.", m: "september", who: "both", p: "high" },
    { t: "Coordinator takes over vendor comms", d: "$2,800 month-of package activates.", m: "september", who: "coordinator", p: "medium" },
    { t: "Confirm bridal shower at The Alida (Nov 5)", d: "Ladies Who Brunch event.", m: "september", who: "nicole", p: "medium" },
    { t: "Ale Santana photographer: detailed shot list", d: "Schmidt-Santana. Confirm timeline against 5:28 PM sunset Nov 6.", m: "september", who: "both", p: "high" },
    { t: "Final dress fitting", d: "", m: "october", who: "nicole", p: "high" },
    { t: "Final tux fitting", d: "Groom and groomsmen.", m: "october", who: "manny", p: "high" },
    { t: "Welcome bags assembled", d: "For out-of-town guests.", m: "october", who: "both", p: "medium" },
    { t: "Programs printed", d: "", m: "october", who: "nicole", p: "medium" },
    { t: "In memoriam table layout finalized", d: "Frames, candles, placement.", m: "october", who: "both", p: "medium" },
    { t: "Father Pablo final ceremony rehearsal scheduled", d: "", m: "october", who: "manny", p: "high" },
    { t: "Taper begins — dial up sleep, hydration", d: "Reduce training intensity 30%.", m: "october", who: "manny", p: "medium" },
    { t: "Final vendor payments", d: "", m: "nov-week", who: "manny", p: "high" },
    { t: "Out-of-town guests arrive (Nov 5)", d: "Confirm Airbnb access.", m: "nov-week", who: "both", p: "high" },
    { t: "Bridal shower — Ladies Who Brunch at The Alida (Nov 5)", d: "", m: "nov-week", who: "nicole", p: "high" },
    { t: "Tux pickup", d: "", m: "nov-week", who: "manny", p: "high" },
    { t: "Manicure / haircut (Nov 5)", d: "", m: "nov-week", who: "manny", p: "medium" },
    { t: "Ceremony rehearsal at Sacred Heart (Nov 5)", d: "", m: "nov-week", who: "both", p: "high" },
    { t: "Rehearsal dinner (Nov 5 evening)", d: "", m: "nov-week", who: "both", p: "high" },
    { t: "WEDDING DAY — November 6, 2026", d: "Sacred Heart ceremony → Charles H. Morris Center reception. Trolley schedule. Sunset 5:28 PM. Marry Nicole.", m: "nov-week", who: "both", p: "high" }
  ];
  const monthLabels = { june: "June", july: "July", august: "August", september: "September", october: "October", "nov-week": "Wedding Week (Nov)" };

  /* ---- Vendors -------------------------------------------------------- */
  const vendors = [
    { name: "Father Pablo Migone", role: "Officiant", status: "signed", cost: null, notes: "Celebrating ceremony at Sacred Heart." },
    { name: "DJ LAGOMARU", role: "DJ", status: "signed", cost: 1350, notes: "Confirm song requests and do-not-play list. Reception at Charles H. Morris Center." },
    { name: "Schmidt-Santana Photography", role: "Photographer", status: "signed", cost: null, notes: "Contact: Ale Santana. Sunset Nov 6 ~5:28 PM — time the photography window. Shot list owed in September." },
    { name: "Sacred Heart Catholic Church", role: "Ceremony Venue", status: "signed", cost: null, notes: "Ceremony location, Savannah." },
    { name: "Charles H. Morris Center", role: "Reception Venue", status: "signed", cost: null, notes: "Reception venue." },
    { name: "Month-of Coordinator", role: "Coordinator", status: "signed", cost: 2800, notes: "Activates in September — takes over vendor comms." },
    { name: "The Alida Hotel", role: "Bridal Shower Venue", status: "no-contract", cost: null, notes: "Bridal shower 'Ladies Who Brunch' on Nov 5." },
    { name: "Trolley Company (TBD)", role: "Transportation", status: "no-contract", cost: null, notes: "Guest transfers Sacred Heart → Charles H. Morris Center. Currently collecting quotes." }
  ];

  /* ---- In Memoriam (placeholders — edit with real names) -------------- */
  const memoriam = [
    { name: "Placeholder 1", rel: "Grandparent (Manny's paternal)", photo: false, framed: false, notes: "Wedding photo desired." },
    { name: "Placeholder 2", rel: "Grandparent (Manny's maternal)", photo: false, framed: false, notes: "Wedding photo desired." },
    { name: "Placeholder 3", rel: "Grandparent (Nicole's paternal)", photo: false, framed: false, notes: "" },
    { name: "Placeholder 4", rel: "Grandparent (Nicole's maternal)", photo: false, framed: false, notes: "" },
    { name: "Placeholder 5", rel: "Family", photo: false, framed: false, notes: "Edit with actual name." },
    { name: "Placeholder 6", rel: "Family", photo: false, framed: false, notes: "Edit with actual name." },
    { name: "Placeholder 7", rel: "Family", photo: false, framed: false, notes: "Edit with actual name." },
    { name: "Placeholder 8", rel: "Family", photo: false, framed: false, notes: "Edit with actual name." },
    { name: "Placeholder 9", rel: "Family", photo: false, framed: false, notes: "Edit with actual name." },
    { name: "Placeholder 10", rel: "Family", photo: false, framed: false, notes: "Edit with actual name." },
    { name: "Placeholder 11", rel: "Family", photo: false, framed: false, notes: "Edit with actual name." },
    { name: "Placeholder 12", rel: "Family", photo: false, framed: false, notes: "Edit with actual name." },
    { name: "Placeholder 13", rel: "Family", photo: false, framed: false, notes: "Edit with actual name." },
    { name: "Placeholder 14", rel: "Family", photo: false, framed: false, notes: "Edit with actual name." }
  ];

  /* ---- Offline food database (for the plain-English calorie lookup) ---
     n=name, u=unit shown, cal+p(rotein) per ONE unit, k=keywords (lowercase;
     matched by substring so plurals like "eggs" hit "egg"). Edit/extend freely. */
  // bump when js/foods.js changes, so saved data re-merges new foods
  const foodSeedVersion = 2;
  // 1,300+ foods come from js/foods.js (window.FOODS); inline list below is a fallback
  const foods = (window.FOODS && window.FOODS.length) ? window.FOODS : [
    // eggs & breakfast
    { n: "Hard-boiled egg", u: "egg", cal: 78, p: 6, k: ["hard boiled egg", "hardboiled egg", "boiled egg", "egg"] },
    { n: "Fried egg", u: "egg", cal: 90, p: 6, k: ["fried egg"] },
    { n: "Scrambled egg", u: "egg", cal: 90, p: 6, k: ["scrambled egg"] },
    { n: "Egg white", u: "white", cal: 17, p: 4, k: ["egg white"] },
    { n: "Oatmeal", u: "cup", cal: 150, p: 5, k: ["oatmeal", "oats", "porridge"] },
    { n: "Cereal", u: "cup", cal: 150, p: 3, k: ["cereal"] },
    { n: "Granola", u: "½ cup", cal: 200, p: 5, k: ["granola"] },
    { n: "Pancake", u: "pancake", cal: 90, p: 2, k: ["pancake"] },
    // breads
    { n: "Sourdough toast", u: "slice", cal: 90, p: 3, k: ["sourdough toast", "sourdough bread", "sourdough slice", "sourdough"] },
    { n: "Whole-grain toast", u: "slice", cal: 80, p: 4, k: ["whole grain bread", "whole wheat bread", "whole wheat toast", "wheat bread", "whole grain toast"] },
    { n: "White toast", u: "slice", cal: 75, p: 2, k: ["white bread", "white toast"] },
    { n: "Toast", u: "slice", cal: 80, p: 3, k: ["toast", "slice of bread", "bread"] },
    { n: "Bagel", u: "bagel", cal: 250, p: 10, k: ["bagel"] },
    { n: "English muffin", u: "muffin", cal: 130, p: 5, k: ["english muffin"] },
    { n: "Corn tortilla", u: "tortilla", cal: 60, p: 1, k: ["corn tortilla"] },
    { n: "Flour tortilla", u: "tortilla", cal: 140, p: 4, k: ["flour tortilla", "tortilla", "wrap"] },
    { n: "Rice cake", u: "cake", cal: 35, p: 1, k: ["rice cake"] },
    // proteins
    { n: "Chicken breast", u: "4 oz", cal: 185, p: 35, k: ["chicken breast", "grilled chicken", "chicken"] },
    { n: "Chicken thigh", u: "thigh", cal: 180, p: 19, k: ["chicken thigh", "thigh"] },
    { n: "Ground turkey", u: "4 oz", cal: 170, p: 22, k: ["ground turkey"] },
    { n: "Turkey meatball", u: "meatball", cal: 60, p: 6, k: ["turkey meatball", "meatball"] },
    { n: "Deli turkey", u: "slice", cal: 30, p: 5, k: ["deli turkey", "turkey slice", "sliced turkey", "turkey breast"] },
    { n: "Salmon", u: "4 oz", cal: 230, p: 25, k: ["salmon"] },
    { n: "Shrimp", u: "4 oz", cal: 120, p: 24, k: ["shrimp"] },
    { n: "Steak (sirloin)", u: "4 oz", cal: 210, p: 31, k: ["sirloin", "steak"] },
    { n: "Flank / carne asada", u: "4 oz", cal: 200, p: 30, k: ["flank steak", "flank", "carne asada"] },
    { n: "Pork tenderloin", u: "4 oz", cal: 160, p: 26, k: ["pork tenderloin", "pork"] },
    { n: "Andouille sausage", u: "2 oz", cal: 180, p: 9, k: ["andouille", "sausage"] },
    { n: "Bacon", u: "slice", cal: 45, p: 3, k: ["bacon"] },
    { n: "Tuna", u: "can", cal: 120, p: 26, k: ["tuna"] },
    // dairy
    { n: "Greek yogurt", u: "cup", cal: 130, p: 22, k: ["greek yogurt", "yogurt"] },
    { n: "Cottage cheese", u: "¾ cup", cal: 110, p: 14, k: ["cottage cheese"] },
    { n: "Milk", u: "cup", cal: 120, p: 8, k: ["milk"] },
    { n: "Cheese", u: "slice", cal: 100, p: 6, k: ["cheese slice", "cheddar", "cheese"] },
    { n: "Butter", u: "tbsp", cal: 100, p: 0, k: ["butter"] },
    { n: "Cream cheese", u: "tbsp", cal: 50, p: 1, k: ["cream cheese"] },
    { n: "Whey / protein shake", u: "scoop", cal: 120, p: 25, k: ["protein shake", "whey", "protein powder", "shake"] },
    // grains & carbs
    { n: "White rice", u: "cup", cal: 205, p: 4, k: ["white rice", "rice"] },
    { n: "Brown rice", u: "cup", cal: 215, p: 5, k: ["brown rice"] },
    { n: "Quinoa", u: "cup", cal: 220, p: 8, k: ["quinoa"] },
    { n: "Farro", u: "cup", cal: 200, p: 7, k: ["farro"] },
    { n: "Pasta", u: "cup", cal: 200, p: 7, k: ["pasta", "spaghetti", "noodles"] },
    { n: "Sweet potato", u: "medium", cal: 110, p: 2, k: ["sweet potato"] },
    { n: "Potato", u: "medium", cal: 160, p: 4, k: ["baked potato", "potato"] },
    { n: "French fries", u: "med order", cal: 365, p: 4, k: ["french fries", "fries"] },
    // fruit
    { n: "Banana", u: "banana", cal: 105, p: 1, k: ["banana"] },
    { n: "Apple", u: "apple", cal: 95, p: 0, k: ["apple"] },
    { n: "Orange", u: "orange", cal: 60, p: 1, k: ["orange"] },
    { n: "Berries", u: "cup", cal: 70, p: 1, k: ["berries", "blueberries", "strawberries", "raspberries"] },
    { n: "Grapes", u: "cup", cal: 100, p: 1, k: ["grapes"] },
    { n: "Avocado", u: "½", cal: 120, p: 1, k: ["avocado"] },
    // veg
    { n: "Broccoli", u: "cup", cal: 30, p: 2, k: ["broccoli"] },
    { n: "Asparagus", u: "cup", cal: 27, p: 3, k: ["asparagus"] },
    { n: "Brussels sprouts", u: "cup", cal: 40, p: 3, k: ["brussels sprouts", "brussels", "brussel sprouts"] },
    { n: "Spinach", u: "cup", cal: 7, p: 1, k: ["spinach"] },
    { n: "Bell pepper", u: "pepper", cal: 30, p: 1, k: ["bell pepper", "pepper"] },
    { n: "Cauliflower rice", u: "cup", cal: 25, p: 2, k: ["cauliflower rice", "cauliflower"] },
    { n: "Side salad", u: "bowl", cal: 30, p: 1, k: ["salad", "greens", "arugula"] },
    { n: "Eggplant", u: "cup", cal: 35, p: 1, k: ["eggplant"] },
    // snacks & fats
    { n: "Almonds", u: "oz", cal: 165, p: 6, k: ["almonds", "almond"] },
    { n: "Peanut butter", u: "tbsp", cal: 95, p: 4, k: ["peanut butter", "pb"] },
    { n: "Protein bar", u: "bar", cal: 200, p: 20, k: ["protein bar"] },
    { n: "Chips", u: "oz", cal: 150, p: 2, k: ["potato chips", "chips"] },
    { n: "Crackers", u: "serving", cal: 80, p: 1, k: ["crackers", "cracker"] },
    { n: "Cookie", u: "cookie", cal: 150, p: 1, k: ["cookie"] },
    { n: "Donut", u: "donut", cal: 250, p: 3, k: ["donut", "doughnut"] },
    { n: "Olive oil", u: "tbsp", cal: 120, p: 0, k: ["olive oil"] },
    { n: "Honey", u: "tbsp", cal: 60, p: 0, k: ["honey"] },
    { n: "Mayo", u: "tbsp", cal: 90, p: 0, k: ["mayo", "mayonnaise"] },
    { n: "Ranch", u: "2 tbsp", cal: 130, p: 1, k: ["ranch"] },
    { n: "Ketchup", u: "tbsp", cal: 20, p: 0, k: ["ketchup"] },
    // meals out
    { n: "Pizza", u: "slice", cal: 285, p: 12, k: ["pizza"] },
    { n: "Cheeseburger", u: "burger", cal: 300, p: 15, k: ["cheeseburger", "hamburger", "burger"] },
    { n: "Taco", u: "taco", cal: 170, p: 8, k: ["taco"] },
    { n: "Sandwich", u: "sandwich", cal: 350, p: 15, k: ["sandwich", "sub"] },
    { n: "Burrito", u: "burrito", cal: 500, p: 20, k: ["burrito"] },
    // drinks
    { n: "Black coffee", u: "cup", cal: 5, p: 0, k: ["black coffee", "coffee"] },
    { n: "Latte", u: "drink", cal: 150, p: 8, k: ["latte", "cappuccino"] },
    { n: "Beer", u: "beer", cal: 150, p: 1, k: ["beer"] },
    { n: "Wine", u: "glass", cal: 125, p: 0, k: ["wine"] },
    { n: "Soda", u: "can", cal: 140, p: 0, k: ["soda", "coke", "pop"] },
    { n: "Orange juice", u: "cup", cal: 110, p: 2, k: ["orange juice", "juice"] },
    { n: "Sports drink", u: "bottle", cal: 80, p: 0, k: ["gatorade", "sports drink", "powerade"] }
  ];

  return {
    profile, phases, blockIcon, mealEmojiByTitle, days, workouts, meals, dinners,
    mealPrepTasks, grocery, fintechModules, fintechMilestones, weddingTasks, monthLabels,
    vendors, memoriam, foods, foodSeedVersion
  };
})();
