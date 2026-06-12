# -*- coding: utf-8 -*-
"""Generate js/foods.js (window.FOODS) — 1000+ foods.
Re-run any time: python gen_foods.py
Calories/protein are reasonable per-serving estimates; users can edit in-app."""
import json, os, unicodedata

FOODS = []
SEEN = set()

def fold(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii").lower()
    s = s.replace("-", " ")
    return " ".join(s.split())

def add(n, u, cal, p, *aliases):
    key = n.lower()
    if key in SEEN:
        return
    SEEN.add(key)
    kw = set()
    kw.add(fold(n))
    base = fold(n.split("(")[0])
    if base:
        kw.add(base)
    for a in aliases:
        kw.add(fold(a))
    FOODS.append({"n": n, "u": u, "cal": int(round(cal)), "p": int(round(p)),
                  "k": sorted(k for k in kw if k)})

# ---- Generic single-word defaults (so "egg", "chicken", "rice" resolve) ----
GENERIC = [
    ("Egg", "egg", 78, 6, "egg"), ("Chicken", "4 oz", 185, 35, "chicken"),
    ("Chicken breast", "4 oz", 185, 35, "chicken breast"), ("Rice", "cup", 205, 4, "rice"),
    ("Bread", "slice", 80, 3, "bread"), ("Shrimp", "4 oz", 120, 24, "shrimp"),
    ("Steak", "5 oz", 280, 38, "steak"), ("Fish", "fillet", 170, 25, "fish"),
    ("Pork", "4 oz", 210, 26, "pork"), ("Beef", "4 oz", 250, 22, "beef"),
    ("Turkey", "4 oz", 150, 30, "turkey"), ("Salmon", "4 oz", 230, 25, "salmon"),
    ("Tilapia", "fillet", 150, 30, "tilapia"), ("Catfish", "fillet", 200, 22, "catfish"),
    ("Yogurt", "cup", 150, 8, "yogurt"), ("Coffee", "cup", 5, 0, "coffee"),
    ("Potato", "medium", 160, 4, "potato"), ("Beans", "cup", 220, 14, "beans"),
    ("Sandwich", "sandwich", 400, 20, "sandwich"), ("Taco", "taco", 180, 12, "taco"),
    ("Burrito", "burrito", 540, 22, "burrito"), ("Pizza", "slice", 285, 12, "pizza"),
    ("Salad", "bowl", 150, 5, "salad"), ("Soup", "bowl", 200, 10, "soup"),
    ("Cookie", "cookie", 150, 2, "cookie"), ("Fries", "medium", 365, 4, "fries"),
    ("Burger", "burger", 300, 15, "burger"), ("Pancakes", "3 cakes", 520, 12, "pancake"),
    ("Oatmeal", "cup", 150, 5, "oats"), ("Chicken wings", "5 wings", 430, 38, "wings"),
    ("Quesadilla", "quesadilla", 450, 20, "quesadilla"), ("Enchilada", "enchilada", 250, 14, "enchilada"),
]
for g in GENERIC:
    add(g[0], g[1], g[2], g[3], g[4])

# ---- 1) PROTEIN x PREPARATION --------------------------------------------
proteins = [
    ("chicken breast", "4 oz", 185, 35), ("chicken tenders", "3 pieces", 165, 30),
    ("chicken strips", "3 pieces", 165, 30), ("chicken wings", "5 wings", 430, 38),
    ("chicken thigh", "thigh", 180, 19), ("chicken drumstick", "drumstick", 130, 14),
    ("chicken nuggets", "6 pieces", 270, 14), ("chicken cutlet", "cutlet", 200, 28),
    ("pork chop", "chop", 210, 26), ("pork tenderloin", "4 oz", 160, 26),
    ("pork ribs", "4 oz", 360, 25), ("pork belly", "3 oz", 450, 9),
    ("catfish", "fillet", 200, 22), ("tilapia", "fillet", 150, 30),
    ("salmon", "4 oz", 230, 25), ("shrimp", "4 oz (10)", 120, 24),
    ("flounder", "fillet", 150, 28), ("whiting fish", "fillet", 160, 22),
    ("cod", "fillet", 160, 30), ("steak", "5 oz", 280, 38),
    ("sirloin steak", "5 oz", 270, 40), ("ribeye steak", "5 oz", 380, 34),
    ("flank steak", "5 oz", 260, 38), ("ground beef", "4 oz", 250, 22),
    ("turkey breast", "4 oz", 150, 34), ("scallops", "4 oz", 130, 22),
    ("oysters", "6", 50, 5), ("crab", "4 oz", 110, 22), ("lobster", "4 oz", 110, 24),
    ("tofu", "4 oz", 110, 11),
]
preps = [
    ("Grilled", 1.00, 1.00), ("Baked", 1.00, 1.00), ("Pan-seared", 1.05, 1.00),
    ("Blackened", 1.08, 1.00), ("Fried", 1.65, 0.95), ("Breaded fried", 1.75, 0.95),
    ("BBQ", 1.25, 1.00), ("Smothered", 1.38, 1.00), ("Crispy", 1.62, 0.95),
    ("Air-fried", 1.15, 1.00),
]
for pn, pu, pcal, pp in proteins:
    for pre, cm, pm in preps:
        if pn in ("chicken nuggets", "chicken wings") and pre in ("Smothered", "Pan-seared"):
            continue
        if pn == "oysters" and pre in ("BBQ", "Smothered", "Blackened", "Baked"):
            continue
        add(f"{pre} {pn}", pu, pcal * cm, pp * pm)

# ---- 2) MEXICAN -----------------------------------------------------------
fillings = [
    ("al pastor", 30, 18), ("carnitas", 40, 18), ("carne asada", 20, 20),
    ("barbacoa", 30, 19), ("chicken", 0, 18), ("pollo", 0, 18),
    ("ground beef", 30, 15), ("picadillo", 30, 15), ("chorizo", 70, 14),
    ("lengua", 30, 19), ("fish", 10, 16), ("shrimp", 10, 16),
    ("camaron", 10, 16), ("bean", -20, 7), ("bean and cheese", 20, 10),
    ("potato", -10, 4), ("rajas", -10, 5), ("nopal", -20, 4),
    ("veggie", -30, 5), ("cheese", 30, 9), ("chicharron", 50, 10),
    ("tripa", 60, 14), ("suadero", 50, 18), ("birria", 40, 20),
]
mex_dishes = [
    ("taco", "taco", 180), ("street taco", "taco", 160), ("burrito", "burrito", 540),
    ("quesadilla", "quesadilla", 450), ("enchilada", "enchilada", 250),
    ("tamale", "tamale", 250), ("torta", "torta", 560), ("tostada", "tostada", 220),
    ("sope", "sope", 240), ("gordita", "gordita", 330), ("chimichanga", "chimichanga", 500),
    ("nachos", "plate", 560), ("taquito", "2 pieces", 220), ("flauta", "2 pieces", 230),
    ("mulita", "mulita", 320), ("burrito bowl", "bowl", 520), ("fajitas", "plate", 430),
    ("quesabirria taco", "taco", 230),
]
for dn, du, dbase in mex_dishes:
    for fn, fmod, fp in fillings:
        if fn == "birria" and dn not in ("taco", "street taco", "quesabirria taco", "burrito", "quesadilla", "nachos"):
            continue
        nm = f"{fn.title()} {dn}"
        prot = fp + (8 if "cheese" in dn or du in ("burrito", "torta", "plate", "bowl") else 4)
        add(nm, du, dbase + fmod, prot)

mex_standalone = [
    ("Chips and salsa", "basket", 320, 5), ("Chips and guacamole", "serving", 400, 6),
    ("Guacamole", "1/2 cup", 230, 3), ("Queso dip", "1/2 cup", 280, 11),
    ("Chile con queso", "1/2 cup", 290, 11), ("Elote (Mexican street corn)", "ear", 220, 5),
    ("Esquites", "cup", 250, 6), ("Mexican rice", "cup", 210, 4),
    ("Refried beans", "cup", 220, 13), ("Black beans", "cup", 220, 15),
    ("Charro beans", "cup", 250, 14), ("Pozole", "bowl", 300, 22),
    ("Menudo", "bowl", 280, 24), ("Birria (bowl)", "bowl", 380, 30),
    ("Tortilla soup", "bowl", 250, 16), ("Caldo de res", "bowl", 320, 26),
    ("Caldo de pollo", "bowl", 240, 22), ("Chile relleno", "each", 360, 14),
    ("Chiles rellenos plate", "plate", 600, 24), ("Carne asada plate", "plate", 650, 45),
    ("Fajita plate", "plate", 700, 42), ("Enchiladas plate (3)", "plate", 700, 30),
    ("Mole with chicken", "plate", 520, 32), ("Pozole verde", "bowl", 300, 22),
    ("Huarache", "each", 420, 16), ("Tlayuda", "each", 700, 28),
    ("Ceviche", "cup", 180, 20), ("Aguachile", "plate", 200, 22),
    ("Pico de gallo", "1/2 cup", 30, 1), ("Mexican rice and beans", "plate", 430, 17),
    ("Carnitas plate", "plate", 620, 40), ("Al pastor plate", "plate", 600, 38),
    ("Tamales (2)", "2 pieces", 500, 16), ("Empanada", "each", 270, 8),
    ("Sincronizada", "each", 400, 18), ("Queso fundido", "serving", 380, 20),
    ("Frijoles a la charra", "cup", 230, 13), ("Sopa de fideo", "bowl", 220, 7),
    ("Tacos de canasta (3)", "3 tacos", 420, 14), ("Quesabirria (3 tacos)", "3 tacos", 690, 36),
]
for t in mex_standalone:
    add(*t)

# ---- 3) SOUTHERN / SAVANNAH / LOWCOUNTRY ----------------------------------
southern = [
    ("Shrimp and grits", "bowl", 480, 28), ("Cheese grits", "cup", 220, 6),
    ("Grits", "cup", 150, 3), ("Fried shrimp", "8 shrimp", 340, 22),
    ("Fried catfish", "fillet", 290, 22), ("Fried whiting", "fillet", 280, 20),
    ("Fried flounder", "fillet", 300, 24), ("Fried oysters", "6", 280, 10),
    ("Fried chicken (2 pieces)", "2 pieces", 540, 38), ("Fried chicken breast", "breast", 360, 36),
    ("Fried chicken thigh", "thigh", 280, 20), ("Fried chicken wing", "wing", 100, 9),
    ("Chicken and waffles", "plate", 720, 36), ("Fried green tomatoes", "4 slices", 250, 4),
    ("Hush puppies", "4 pieces", 280, 4), ("Cornbread", "slice", 200, 4),
    ("Collard greens", "cup", 120, 5), ("Turnip greens", "cup", 90, 4),
    ("Mac and cheese", "cup", 380, 14), ("Baked beans", "cup", 280, 12),
    ("Black-eyed peas", "cup", 200, 13), ("Field peas", "cup", 190, 12),
    ("Fried okra", "cup", 240, 4), ("Stewed okra", "cup", 90, 3),
    ("Biscuits and gravy", "plate", 520, 12), ("Buttermilk biscuit", "biscuit", 210, 4),
    ("Sausage gravy", "1/2 cup", 180, 6), ("Pulled pork", "4 oz", 280, 24),
    ("Pulled pork sandwich", "sandwich", 480, 28), ("BBQ brisket", "4 oz", 320, 28),
    ("BBQ ribs (4)", "4 ribs", 500, 30), ("Smoked sausage", "link", 250, 12),
    ("Pimento cheese", "1/4 cup", 200, 6), ("Pimento cheese sandwich", "sandwich", 420, 13),
    ("Deviled eggs (2)", "2 halves", 140, 6), ("Crab cake", "cake", 220, 14),
    ("Crab cakes (2)", "2 cakes", 440, 28), ("She-crab soup", "bowl", 320, 16),
    ("Low country boil", "plate", 600, 38), ("Frogmore stew", "plate", 600, 38),
    ("Shrimp po'boy", "sandwich", 620, 24), ("Oyster po'boy", "sandwich", 640, 20),
    ("Catfish po'boy", "sandwich", 640, 26), ("Gumbo", "bowl", 350, 22),
    ("Shrimp and sausage gumbo", "bowl", 400, 26), ("Jambalaya", "bowl", 450, 24),
    ("Savannah red rice", "cup", 280, 9), ("Dirty rice", "cup", 280, 10),
    ("Hoppin' John", "cup", 260, 11), ("Cornbread dressing", "cup", 290, 6),
    ("Country fried steak", "plate", 560, 30), ("Chicken fried steak", "plate", 580, 30),
    ("Smothered pork chop", "plate", 420, 28), ("Fried pork chop", "chop", 340, 26),
    ("Boiled peanuts", "cup", 200, 12), ("Sweet potato casserole", "cup", 320, 4),
    ("Candied yams", "cup", 290, 3), ("Green bean casserole", "cup", 160, 4),
    ("Cole slaw", "cup", 180, 2), ("Potato salad", "cup", 360, 6),
    ("Macaroni salad", "cup", 360, 7), ("Cornbread muffin", "muffin", 180, 4),
    ("Fried fish plate", "plate", 700, 36), ("Seafood platter", "platter", 950, 48),
    ("Crawfish boil", "plate", 500, 34), ("Steamed crab legs", "1 lb", 280, 56),
    ("Fried gizzards", "cup", 360, 26), ("Smoked turkey leg", "leg", 480, 54),
]
for t in southern:
    add(*t)

# ---- 4) FRIED / FAST FOOD -------------------------------------------------
fried = [
    ("French fries", "medium", 365, 4), ("French fries (large)", "large", 510, 6),
    ("French fries (small)", "small", 230, 3), ("Sweet potato fries", "serving", 300, 3),
    ("Curly fries", "serving", 400, 5), ("Waffle fries", "serving", 390, 5),
    ("Cajun fries", "serving", 420, 5), ("Tater tots", "serving", 300, 4),
    ("Hash browns", "serving", 280, 3), ("Onion rings", "serving", 410, 6),
    ("Mozzarella sticks (5)", "5 sticks", 510, 22), ("Jalapeno poppers (6)", "6 pieces", 420, 11),
    ("Fried pickles", "serving", 320, 5), ("Fried mushrooms", "serving", 350, 6),
    ("Corn dog", "each", 290, 9), ("Corn nuggets", "serving", 280, 4),
    ("Egg roll", "each", 220, 7), ("Spring roll", "each", 120, 4),
    ("Crab rangoon (4)", "4 pieces", 320, 8), ("Chicken sandwich", "sandwich", 510, 28),
    ("Spicy chicken sandwich", "sandwich", 560, 28), ("Fried chicken sandwich", "sandwich", 540, 29),
    ("Chicken biscuit", "sandwich", 450, 18), ("Fish sandwich", "sandwich", 470, 18),
    ("Chicken nuggets (10)", "10 pieces", 430, 22), ("Popcorn chicken", "serving", 400, 24),
    ("Chicken and fries", "combo", 800, 36), ("Chicken tenders and fries", "combo", 700, 34),
    ("Loaded fries", "serving", 700, 22), ("Chili cheese fries", "serving", 700, 20),
    ("Cheeseburger", "burger", 300, 15), ("Double cheeseburger", "burger", 450, 25),
    ("Bacon cheeseburger", "burger", 480, 26), ("Hamburger", "burger", 250, 13),
    ("Quarter pounder", "burger", 520, 30), ("Burger and fries combo", "combo", 1000, 34),
    ("Fried bologna sandwich", "sandwich", 380, 14), ("Philly cheesesteak", "sandwich", 700, 36),
    ("Gyro", "each", 590, 30), ("Falafel (4)", "4 pieces", 330, 12),
    ("Cheese quesadilla", "quesadilla", 510, 20), ("Chicken quesadilla", "quesadilla", 620, 34),
]
for t in fried:
    add(*t)

# ---- 5) DESSERTS ----------------------------------------------------------
desserts = [
    ("Churro", "each", 120, 1), ("Churros (3)", "3 pieces", 360, 3),
    ("Flan", "slice", 300, 7), ("Tres leches cake", "slice", 360, 6),
    ("Concha (pan dulce)", "each", 280, 6), ("Pan dulce", "piece", 270, 5),
    ("Sopapilla", "each", 150, 2), ("Bunuelo", "each", 170, 2),
    ("Arroz con leche", "cup", 280, 7), ("Mexican hot chocolate", "cup", 200, 7),
    ("Cajeta crepe", "each", 350, 5), ("Polvorones", "2 cookies", 200, 2),
    ("Mangonada", "each", 330, 2), ("Raspado (shaved ice)", "each", 200, 0),
    ("Paleta (fruit)", "each", 110, 1), ("Paleta (cream)", "each", 180, 3),
    ("Dessert empanada", "each", 290, 4), ("Capirotada", "cup", 380, 7),
    ("Pecan pie", "slice", 500, 5), ("Peach cobbler", "cup", 360, 4),
    ("Banana pudding", "cup", 380, 5), ("Key lime pie", "slice", 400, 6),
    ("Sweet potato pie", "slice", 340, 5), ("Red velvet cake", "slice", 470, 5),
    ("Pound cake", "slice", 320, 4), ("Carrot cake", "slice", 430, 5),
    ("Chocolate cake", "slice", 350, 4), ("Cheesecake", "slice", 400, 7),
    ("Brownie", "each", 230, 3), ("Blondie", "each", 240, 3),
    ("Apple pie", "slice", 410, 4), ("Cherry pie", "slice", 400, 4),
    ("Bread pudding", "cup", 340, 6), ("Cinnamon roll", "each", 340, 5),
    ("Funnel cake", "each", 430, 6), ("Beignets (3)", "3 pieces", 300, 5),
    ("Tiramisu", "slice", 360, 6), ("Cannoli", "each", 240, 5),
    ("Donut (glazed)", "each", 240, 3), ("Donut (chocolate)", "each", 280, 4),
    ("Donut (jelly)", "each", 290, 4), ("Donut (cake)", "each", 300, 4),
    ("Donut (Boston cream)", "each", 320, 4), ("Donut (old fashioned)", "each", 290, 3),
    ("Cinnamon sugar donut", "each", 270, 3), ("Donut holes (5)", "5 pieces", 250, 3),
]
for t in desserts:
    add(*t)
ic = ["vanilla", "chocolate", "strawberry", "cookies and cream", "mint chocolate chip",
      "butter pecan", "rocky road", "cookie dough", "coffee", "pistachio", "neapolitan", "dulce de leche"]
for fl in ic:
    add(f"Ice cream ({fl})", "scoop", 145 if "cream" not in fl else 170, 3)
    add(f"{fl.title()} milkshake", "16 oz", 560, 12)
for ct in ["chocolate chip", "oatmeal raisin", "peanut butter", "sugar", "snickerdoodle",
           "double chocolate", "white chocolate macadamia", "shortbread"]:
    add(f"{ct.title()} cookie", "cookie", 150, 2)
for nm, c, pp in [("Snickers bar", 250, 4), ("Kit Kat", 210, 3), ("Reese's cups (2)", 210, 5),
                  ("M&M's (fun size x3)", 220, 2), ("Twix", 250, 2), ("Milky Way", 240, 2),
                  ("Hershey's bar", 220, 3), ("Skittles (fun size)", 230, 0),
                  ("Sour Patch Kids", 210, 0), ("Gummy bears (handful)", 140, 2)]:
    add(nm, "each", c, pp)
for nm, c, pp in [("Croissant", 270, 5), ("Chocolate croissant", 340, 6), ("Danish", 290, 5),
                  ("Blueberry muffin", 380, 6), ("Chocolate chip muffin", 420, 6),
                  ("Banana nut muffin", 400, 7), ("Scone", 380, 7), ("Pop-Tart (2)", 360, 4),
                  ("Toaster strudel", 190, 3), ("Coffee cake", 330, 4), ("Pumpkin bread", 290, 4),
                  ("Banana bread", 280, 4), ("Belgian waffle", 310, 7), ("Pancakes (3)", 520, 12),
                  ("French toast (2)", 360, 10)]:
    add(nm, "each", c, pp)

# ---- 6) BREAKFAST ---------------------------------------------------------
breakfast = [
    ("Bacon, egg, and cheese biscuit", "sandwich", 420, 16), ("Sausage, egg, and cheese biscuit", "sandwich", 480, 17),
    ("Bacon, egg, and cheese bagel", "sandwich", 470, 20), ("Breakfast burrito", "burrito", 540, 22),
    ("Chorizo and egg taco", "taco", 230, 11), ("Bacon and egg taco", "taco", 210, 10),
    ("Migas", "plate", 420, 20), ("Huevos rancheros", "plate", 480, 20),
    ("Chilaquiles", "plate", 520, 18), ("Cheese omelette (3 egg)", "omelette", 380, 24),
    ("Western omelette", "omelette", 420, 26), ("Veggie omelette", "omelette", 320, 20),
    ("Scrambled eggs (2)", "2 eggs", 180, 12), ("Bacon (3 strips)", "3 strips", 135, 9),
    ("Sausage links (2)", "2 links", 200, 8), ("Sausage patty", "patty", 100, 5),
    ("Pancakes with syrup", "3 cakes", 600, 12), ("Waffle with syrup", "waffle", 410, 8),
    ("French toast with syrup", "2 slices", 480, 10), ("Avocado toast", "slice", 200, 6),
    ("Yogurt parfait", "cup", 250, 10), ("Greek yogurt with granola", "cup", 290, 18),
    ("Smoothie bowl", "bowl", 350, 8), ("Bagel with cream cheese", "each", 380, 12),
    ("Breakfast croissant sandwich", "sandwich", 480, 18), ("Hash brown patty", "patty", 150, 1),
    ("Breakfast bowl", "bowl", 560, 26),
]
for t in breakfast:
    add(*t)

# ---- 7) SANDWICHES / SUBS -------------------------------------------------
for nm, c, pp in [("Turkey sandwich", 350, 22), ("Ham sandwich", 360, 20), ("Italian sub", 560, 28),
                  ("Meatball sub", 580, 28), ("Chicken bacon ranch sub", 620, 36), ("BLT", 400, 14),
                  ("Club sandwich", 520, 30), ("Tuna sandwich", 380, 22), ("Chicken salad sandwich", 440, 24),
                  ("Egg salad sandwich", 420, 16), ("Grilled cheese", 400, 16), ("Patty melt", 600, 30),
                  ("Reuben", 620, 32), ("Cuban sandwich", 560, 34), ("Chicken caesar wrap", 480, 30),
                  ("Buffalo chicken wrap", 560, 32), ("Veggie wrap", 380, 12), ("BBQ pork sandwich", 520, 30),
                  ("Roast beef sandwich", 420, 28)]:
    add(nm, "sandwich", c, pp)

# ---- 8) PIZZA / ITALIAN ---------------------------------------------------
for nm, c, pp in [("Cheese pizza", 285, 12), ("Pepperoni pizza", 310, 13), ("Sausage pizza", 330, 14),
                  ("Supreme pizza", 320, 14), ("Meat lovers pizza", 360, 16), ("Margherita pizza", 270, 12),
                  ("Hawaiian pizza", 290, 13), ("BBQ chicken pizza", 320, 15), ("Veggie pizza", 270, 11),
                  ("Buffalo chicken pizza", 330, 15), ("White pizza", 300, 13)]:
    add(nm, "slice", c, pp)
for t in [("Spaghetti and meatballs", "plate", 670, 30), ("Fettuccine alfredo", "plate", 800, 22),
          ("Chicken alfredo", "plate", 980, 45), ("Lasagna", "piece", 500, 28),
          ("Baked ziti", "cup", 430, 20), ("Chicken parmesan", "plate", 720, 46),
          ("Eggplant parmesan", "plate", 560, 20), ("Penne vodka", "plate", 620, 18),
          ("Shrimp scampi", "plate", 560, 30), ("Cheese ravioli", "cup", 380, 16),
          ("Tortellini", "cup", 410, 18), ("Garlic bread", "slice", 180, 4),
          ("Breadsticks (2)", "2 sticks", 280, 8), ("Caesar salad", "bowl", 360, 10),
          ("Caprese salad", "plate", 300, 14), ("Minestrone soup", "bowl", 220, 9),
          ("Calzone", "each", 800, 38), ("Stromboli", "each", 700, 32),
          ("Baked mac and cheese", "cup", 400, 15), ("Risotto", "cup", 430, 10)]:
    add(*t)

# ---- 9) ASIAN & OTHER -----------------------------------------------------
for t in [("Fried rice", "cup", 330, 8), ("Chicken fried rice", "cup", 360, 16),
          ("Shrimp fried rice", "cup", 350, 16), ("Lo mein", "cup", 380, 12),
          ("Chicken lo mein", "cup", 420, 20), ("Beef and broccoli", "plate", 480, 30),
          ("General Tso's chicken", "plate", 800, 30), ("Orange chicken", "plate", 760, 28),
          ("Sesame chicken", "plate", 770, 28), ("Sweet and sour chicken", "plate", 700, 26),
          ("Kung pao chicken", "plate", 640, 30), ("Mongolian beef", "plate", 720, 34),
          ("Egg drop soup", "bowl", 110, 5), ("Hot and sour soup", "bowl", 160, 8),
          ("Wonton soup", "bowl", 190, 11), ("Pork dumplings (6)", "6 pieces", 360, 14),
          ("Pot stickers (6)", "6 pieces", 350, 13), ("Pad thai", "plate", 660, 24),
          ("Drunken noodles", "plate", 640, 24), ("Chicken teriyaki", "plate", 520, 38),
          ("Teriyaki bowl", "bowl", 560, 30), ("California roll (8)", "8 pieces", 255, 7),
          ("Spicy tuna roll (8)", "8 pieces", 290, 12), ("Salmon roll (8)", "8 pieces", 300, 14),
          ("Edamame", "cup", 190, 17), ("Curry chicken", "plate", 560, 30),
          ("Tikka masala", "plate", 620, 32), ("Naan", "piece", 260, 8),
          ("Basmati rice", "cup", 210, 4), ("Pho", "bowl", 420, 30), ("Banh mi", "sandwich", 500, 24),
          ("Bibimbap", "bowl", 560, 24), ("Korean BBQ beef", "plate", 540, 34)]:
    add(*t)

# ---- 10) FRUITS -----------------------------------------------------------
for t in [("Banana", "each", 105, 1), ("Apple", "each", 95, 0), ("Orange", "each", 60, 1),
          ("Grapes", "cup", 100, 1), ("Strawberries", "cup", 50, 1), ("Blueberries", "cup", 85, 1),
          ("Raspberries", "cup", 65, 1), ("Blackberries", "cup", 62, 2), ("Mixed berries", "cup", 70, 1),
          ("Watermelon", "cup", 46, 1), ("Cantaloupe", "cup", 54, 1), ("Honeydew", "cup", 61, 1),
          ("Pineapple", "cup", 82, 1), ("Mango", "each", 200, 3), ("Papaya", "cup", 62, 1),
          ("Peach", "each", 60, 1), ("Pear", "each", 100, 1), ("Plum", "each", 30, 0),
          ("Kiwi", "each", 42, 1), ("Cherries", "cup", 90, 2), ("Pomegranate", "cup", 145, 3),
          ("Avocado", "half", 120, 1), ("Grapefruit", "half", 52, 1),
          ("Dried mango", "1/4 cup", 130, 1), ("Raisins", "1/4 cup", 110, 1), ("Dates (3)", "3 dates", 200, 2),
          ("Fruit cup", "cup", 80, 1), ("Fried plantains", "1/2 cup", 200, 1),
          ("Tostones", "serving", 270, 2), ("Mexican fruit cup with chili", "cup", 130, 2),
          ("Coconut", "1/2 cup", 140, 1), ("Lime", "each", 20, 0), ("Lemon", "each", 17, 0)]:
    add(*t)

# ---- 11) VEGETABLES -------------------------------------------------------
for t in [("Broccoli", "cup", 30, 2), ("Roasted broccoli", "cup", 70, 3), ("Asparagus", "cup", 27, 3),
          ("Green beans", "cup", 35, 2), ("Brussels sprouts", "cup", 40, 3), ("Roasted Brussels sprouts", "cup", 110, 4),
          ("Spinach", "cup", 7, 1), ("Sauteed spinach", "cup", 60, 3), ("Kale", "cup", 33, 3),
          ("Mixed greens", "cup", 10, 1), ("Side salad", "bowl", 30, 1), ("Garden salad", "bowl", 120, 4),
          ("Bell pepper", "each", 30, 1), ("Cauliflower", "cup", 27, 2),
          ("Roasted cauliflower", "cup", 80, 3), ("Carrots", "cup", 50, 1), ("Cucumber", "cup", 16, 1),
          ("Tomato", "each", 22, 1), ("Cherry tomatoes", "cup", 27, 1), ("Zucchini", "cup", 20, 1),
          ("Sauteed zucchini", "cup", 70, 2), ("Mushrooms", "cup", 15, 2), ("Sauteed mushrooms", "cup", 90, 4),
          ("Corn on the cob", "ear", 90, 3), ("Corn", "cup", 130, 5), ("Sweet potato", "medium", 110, 2),
          ("Baked potato", "medium", 160, 4), ("Loaded baked potato", "each", 420, 12), ("Mashed potatoes", "cup", 240, 4),
          ("Roasted potatoes", "cup", 200, 4), ("Cabbage", "cup", 22, 1), ("Cauliflower rice", "cup", 25, 2),
          ("Eggplant", "cup", 35, 1), ("Okra", "cup", 35, 2), ("Squash", "cup", 36, 1), ("Beets", "cup", 60, 2)]:
    add(*t)

# ---- 12) GRAINS / SIDES ---------------------------------------------------
for t in [("White rice", "cup", 205, 4), ("Brown rice", "cup", 215, 5), ("Quinoa", "cup", 220, 8),
          ("Farro", "cup", 200, 7), ("Couscous", "cup", 175, 6), ("Pasta", "cup", 200, 7),
          ("Whole wheat pasta", "cup", 180, 8), ("Oats (dry)", "1/2 cup", 150, 5), ("Bagel", "each", 250, 10),
          ("English muffin", "each", 130, 5), ("Sourdough toast", "slice", 90, 3), ("Whole-grain toast", "slice", 80, 4),
          ("White toast", "slice", 75, 2), ("Toast", "slice", 80, 3), ("Flour tortilla", "each", 140, 4),
          ("Corn tortilla", "each", 60, 1), ("Rice cake", "each", 35, 1), ("Saltine crackers (5)", "5", 70, 1),
          ("Pita bread", "each", 165, 6), ("Dinner roll", "each", 110, 3), ("Garlic knot", "each", 110, 3),
          ("Hawaiian roll", "each", 90, 2), ("Sweet cornbread", "slice", 220, 4), ("Biscuit", "each", 210, 4)]:
    add(*t)

# ---- 13) DAIRY / EGGS -----------------------------------------------------
for t in [("Hard-boiled egg", "egg", 78, 6), ("Fried egg", "egg", 90, 6), ("Scrambled egg", "egg", 90, 6),
          ("Poached egg", "egg", 72, 6), ("Egg white", "white", 17, 4), ("Plain omelette (2 egg)", "omelette", 200, 12),
          ("Greek yogurt", "cup", 130, 22), ("Flavored greek yogurt", "cup", 160, 14),
          ("Regular yogurt", "cup", 150, 8), ("Cottage cheese", "3/4 cup", 110, 14), ("Milk (2%)", "cup", 120, 8),
          ("Whole milk", "cup", 150, 8), ("Skim milk", "cup", 80, 8), ("Almond milk", "cup", 40, 1),
          ("Oat milk", "cup", 120, 3), ("Chocolate milk", "cup", 210, 8), ("Cheddar cheese", "slice", 110, 7),
          ("String cheese", "stick", 80, 7), ("Shredded cheese", "1/4 cup", 110, 7), ("Cream cheese", "tbsp", 50, 1),
          ("Butter", "tbsp", 100, 0), ("Sour cream", "2 tbsp", 60, 1), ("Queso fresco", "oz", 80, 5),
          ("Cotija cheese", "oz", 90, 5), ("Whey protein shake", "scoop", 120, 25), ("Premade protein shake", "bottle", 160, 30)]:
    add(*t)

# ---- 14) SNACKS -----------------------------------------------------------
for t in [("Almonds", "oz", 165, 6), ("Cashews", "oz", 160, 5), ("Peanuts", "oz", 160, 7),
          ("Mixed nuts", "oz", 170, 5), ("Pistachios", "oz", 160, 6), ("Walnuts", "oz", 185, 4),
          ("Peanut butter", "tbsp", 95, 4), ("Almond butter", "tbsp", 100, 3), ("Trail mix", "1/4 cup", 175, 5),
          ("Granola", "1/2 cup", 200, 5), ("Granola bar", "bar", 150, 3), ("Protein bar", "bar", 200, 20),
          ("Clif bar", "bar", 250, 9), ("Rice Krispies treat", "bar", 90, 1), ("Potato chips", "oz", 150, 2),
          ("Tortilla chips", "oz", 140, 2), ("Doritos", "oz", 150, 2), ("Cheetos", "oz", 160, 2),
          ("Pretzels", "oz", 110, 3), ("Air-popped popcorn", "3 cups", 90, 3), ("Buttered popcorn", "3 cups", 180, 3),
          ("Movie popcorn", "medium", 600, 9), ("Goldfish", "1 cup", 140, 3),
          ("Beef jerky", "oz", 80, 13), ("Hummus", "1/4 cup", 100, 4), ("Hummus with pita", "serving", 280, 9),
          ("Chips and queso", "serving", 480, 12), ("Apple with peanut butter", "serving", 285, 8),
          ("Cheese and crackers", "serving", 220, 8), ("Pork rinds", "oz", 150, 17),
          ("Fruit snacks", "pouch", 80, 0), ("Soft pretzel", "each", 380, 10)]:
    add(*t)

# ---- 15) DRINKS -----------------------------------------------------------
for t in [("Black coffee", "cup", 5, 0), ("Coffee with cream and sugar", "cup", 60, 1), ("Latte", "12 oz", 150, 8),
          ("Cappuccino", "12 oz", 120, 7), ("Caramel macchiato", "16 oz", 250, 10), ("Mocha", "16 oz", 290, 11),
          ("Iced coffee", "16 oz", 120, 2), ("Cold brew", "16 oz", 5, 0), ("Frappuccino", "16 oz", 380, 5),
          ("Sweet tea", "16 oz", 180, 0), ("Unsweet tea", "16 oz", 5, 0), ("Arnold Palmer", "16 oz", 120, 0),
          ("Lemonade", "16 oz", 200, 0), ("Soda", "can", 140, 0), ("Diet soda", "can", 0, 0),
          ("Coca-Cola", "can", 140, 0), ("Sprite", "can", 140, 0), ("Dr Pepper", "can", 150, 0),
          ("Mexican Coke", "bottle", 150, 0), ("Jarritos", "bottle", 190, 0), ("Horchata", "16 oz", 220, 3),
          ("Agua fresca", "16 oz", 110, 0), ("Tamarindo", "16 oz", 160, 0), ("Orange juice", "cup", 110, 2),
          ("Apple juice", "cup", 115, 0), ("Cranberry juice", "cup", 116, 0), ("Gatorade", "20 oz", 140, 0),
          ("Powerade", "20 oz", 130, 0), ("Energy drink", "can", 160, 0), ("Red Bull", "8.4 oz", 110, 1),
          ("Protein shake", "bottle", 160, 30), ("Smoothie", "16 oz", 300, 6), ("Protein smoothie", "16 oz", 350, 25),
          ("Beer", "12 oz", 150, 1), ("Light beer", "12 oz", 100, 1), ("IPA", "12 oz", 200, 2),
          ("Modelo", "12 oz", 145, 1), ("Corona", "12 oz", 150, 1), ("Margarita", "drink", 280, 0),
          ("Michelada", "drink", 180, 2), ("Red wine", "glass", 125, 0), ("White wine", "glass", 120, 0),
          ("Whiskey", "1.5 oz", 105, 0), ("Tequila shot", "1.5 oz", 100, 0), ("Rum and Coke", "drink", 180, 0),
          ("Vodka soda", "drink", 100, 0), ("Pina colada", "drink", 350, 1), ("Water", "glass", 0, 0),
          ("Sparkling water", "can", 0, 0), ("Coconut water", "cup", 45, 0), ("Hot chocolate", "cup", 190, 8),
          ("Chai latte", "12 oz", 200, 6), ("Matcha latte", "12 oz", 180, 6)]:
    add(*t)

# ---- 16) CONDIMENTS -------------------------------------------------------
for t in [("Olive oil", "tbsp", 120, 0), ("Mayo", "tbsp", 90, 0),
          ("Ketchup", "tbsp", 20, 0), ("Mustard", "tbsp", 10, 1), ("Ranch dressing", "2 tbsp", 130, 1),
          ("Honey mustard", "2 tbsp", 100, 0), ("BBQ sauce", "2 tbsp", 60, 0), ("Hot sauce", "tbsp", 5, 0),
          ("Salsa verde", "1/4 cup", 25, 1), ("Salsa", "1/4 cup", 20, 1), ("Honey", "tbsp", 60, 0),
          ("Maple syrup", "2 tbsp", 110, 0), ("Gravy", "1/4 cup", 50, 1), ("Cheese sauce", "1/4 cup", 110, 4),
          ("Soy sauce", "tbsp", 10, 1), ("Teriyaki sauce", "tbsp", 15, 0), ("Caesar dressing", "2 tbsp", 160, 1),
          ("Italian dressing", "2 tbsp", 110, 0), ("Vinaigrette", "2 tbsp", 90, 0), ("Blue cheese dressing", "2 tbsp", 150, 1),
          ("Tartar sauce", "2 tbsp", 140, 0), ("Cocktail sauce", "2 tbsp", 30, 0), ("Pesto", "2 tbsp", 160, 3),
          ("Marinara sauce", "1/2 cup", 80, 2), ("Alfredo sauce", "1/2 cup", 220, 5), ("Jam", "tbsp", 50, 0),
          ("Nutella", "tbsp", 100, 1)]:
    add(*t)

out = "window.FOODS = [\n" + ",\n".join(
    "  " + json.dumps(f, ensure_ascii=False, separators=(",", ":")) for f in FOODS) + "\n];\n"
with open(os.path.join(os.path.dirname(__file__), "js", "foods.js"), "w", encoding="utf-8") as fh:
    fh.write(out)
print("Wrote", len(FOODS), "foods")
