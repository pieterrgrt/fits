/*
  Basislijst: gewone producten met richtwaarden per 100 g (of 100 ml), afgerond.
  Gebaseerd op gangbare voedingswaardetabellen; merkproducten komen uit Open Food Facts.
  Velden: [naam, kcal, eiwit, koolhydraten, vet, vezels, suiker, porties?, eenheid?]
  porties: [[naam, gram], …]
*/

const P = {
	stuk: (g) => [['stuk', g]],
	snee: [['snee', 35]],
	el: (g = 15) => [['eetlepel', g]],
	tl: (g = 5) => [['theelepel', g]],
	glas: [['glas', 200]],
	bord: (g) => [['portie', g]]
};

const LIJST = {
	// Brood, ontbijt, granen
	'volkorenbrood': ['Volkorenbrood', 240, 10, 41, 2.5, 7, 3, P.snee],
	'bruinbrood': ['Bruinbrood', 245, 9.5, 43, 2.8, 5.5, 3.5, P.snee],
	'witbrood': ['Witbrood', 260, 8.5, 49, 2.8, 2.7, 4, P.snee],
	'roggebrood': ['Roggebrood', 205, 5.5, 39, 1.5, 9, 5, [['snee', 40]]],
	'krentenbol': ['Krentenbol', 285, 8, 52, 4.5, 3, 18, P.stuk(60)],
	'beschuit': ['Beschuit', 400, 10, 72, 6, 4, 6, P.stuk(10)],
	'knackebrod': ['Knäckebröd volkoren', 360, 10, 62, 2, 17, 2, P.stuk(13)],
	'rijstwafel': ['Rijstwafel', 385, 8, 81, 3, 3, 0.5, P.stuk(8)],
	'havermout': ['Havermout', 370, 13.5, 59, 7, 10, 1, [['portie', 40], ['eetlepel', 10]]],
	'muesli': ['Muesli (zonder toegevoegde suiker)', 360, 10, 60, 6, 8, 15, [['portie', 50]]],
	'cruesli': ['Cruesli', 445, 8, 64, 16, 6, 22, [['portie', 45]]],
	'cornflakes': ['Cornflakes', 375, 7, 84, 1, 3, 8, [['portie', 30]]],
	'wrap': ['Wrap (tortilla)', 310, 8.5, 51, 7.5, 3, 3, P.stuk(60)],
	'croissant': ['Croissant', 410, 8, 45, 21, 2.5, 8, P.stuk(60)],
	'pannenkoek': ['Pannenkoek (naturel)', 210, 7, 28, 7.5, 1, 5, P.stuk(80)],

	// Beleg en zuivel
	'kaas-48': ['Kaas 48+ (Goudse)', 375, 25, 0, 30, 0, 0, [['plak', 20]]],
	'kaas-30': ['Kaas 30+', 295, 30, 0, 19, 0, 0, [['plak', 20]]],
	'huttenkase': ['Hüttenkäse', 95, 12.5, 2.5, 4, 0, 2, P.el(30)],
	'mozzarella': ['Mozzarella', 245, 18, 1.5, 18.5, 0, 1, P.stuk(125)],
	'feta': ['Feta', 265, 14, 1, 23, 0, 1, [['portie', 30]]],
	'roomkaas': ['Roomkaas', 280, 6, 4, 27, 0, 3.5, P.el(20)],
	'pindakaas': ['Pindakaas', 615, 25, 13, 50, 6, 6, P.el(15)],
	'hagelslag-puur': ['Hagelslag puur', 455, 5, 70, 15, 6, 60, [['portie', 15]]],
	'jam': ['Jam', 245, 0.5, 60, 0, 1, 55, P.tl(15)],
	'honing': ['Honing', 305, 0.3, 82, 0, 0, 82, P.tl(10)],
	'kipfilet-beleg': ['Kipfilet (vleeswaren)', 105, 21, 1.5, 1.5, 0, 1, [['plak', 15]]],
	'achterham': ['Achterham', 115, 19, 1, 4, 0, 1, [['plak', 15]]],
	'rookvlees': ['Rookvlees', 110, 24, 0.5, 1.5, 0, 0.5, [['plak', 10]]],
	'filet-americain': ['Filet americain', 225, 15, 1.5, 18, 0, 1, [['portie', 30]]],
	'hummus': ['Hummus', 300, 7.5, 12, 24, 5, 0.5, P.el(20)],
	'boter': ['Roomboter', 740, 0.6, 0.6, 82, 0, 0.6, P.tl(5)],
	'halvarine': ['Halvarine', 350, 0, 0.5, 38, 0, 0.5, P.tl(5)],
	'ei': ['Ei (gekookt)', 140, 12.5, 0.5, 10, 0, 0.5, P.stuk(55)],
	'eiwit-ei': ['Eiwit van ei', 50, 11, 0.7, 0.2, 0, 0.7, P.stuk(33)],

	'melk-halfvol': ['Halfvolle melk', 46, 3.5, 4.7, 1.5, 0, 4.7, P.glas],
	'melk-vol': ['Volle melk', 63, 3.4, 4.6, 3.5, 0, 4.6, P.glas],
	'melk-mager': ['Magere melk', 35, 3.5, 4.8, 0.1, 0, 4.8, P.glas],
	'karnemelk': ['Karnemelk', 33, 3.2, 4, 0.5, 0, 4, P.glas],
	'yoghurt-mager': ['Magere yoghurt', 37, 4, 4.5, 0.1, 0, 4.5, [['schaaltje', 150]]],
	'yoghurt-vol': ['Volle yoghurt', 62, 3.8, 4.5, 3.2, 0, 4.5, [['schaaltje', 150]]],
	'griekse-yoghurt': ['Griekse yoghurt 10%', 120, 4.5, 4, 10, 0, 4, [['schaaltje', 150]]],
	'skyr': ['Skyr naturel', 63, 11, 4, 0.2, 0, 4, [['schaaltje', 150]]],
	'kwark-mager': ['Magere kwark', 60, 10, 3.8, 0.2, 0, 3.8, [['schaaltje', 150]]],
	'kwark-half': ['Halfvolle kwark', 85, 9.5, 3.7, 3.5, 0, 3.7, [['schaaltje', 150]]],
	'proteine-pudding': ['Proteïnepudding', 75, 10, 6, 1.5, 0.5, 4, P.stuk(200)],
	'sojadrink': ['Sojadrink (ongezoet)', 33, 3.3, 0.5, 1.8, 0.5, 0.3, P.glas],
	'havermelk': ['Haverdrink', 45, 1, 6.5, 1.5, 0.8, 3.5, P.glas],

	// Vlees, vis, vega
	'kipfilet': ['Kipfilet (bereid)', 150, 31, 0, 2.5, 0, 0, [['stuk', 120]]],
	'kippendij': ['Kippendijfilet (bereid)', 190, 26, 0, 9.5, 0, 0, [['stuk', 100]]],
	'gehakt-rund': ['Rundergehakt (bereid)', 245, 26, 0, 15, 0, 0, [['portie', 100]]],
	'gehakt-mager': ['Mager rundergehakt (bereid)', 175, 27, 0, 7, 0, 0, [['portie', 100]]],
	'biefstuk': ['Biefstuk (bereid)', 175, 29, 0, 6.5, 0, 0, [['stuk', 120]]],
	'varkenshaas': ['Varkenshaas (bereid)', 150, 28, 0, 4, 0, 0, [['portie', 120]]],
	'kalkoen': ['Kalkoenfilet (bereid)', 140, 30, 0, 2, 0, 0, [['portie', 120]]],
	'zalm': ['Zalm (bereid)', 210, 23, 0, 13, 0, 0, [['moot', 125]]],
	'kabeljauw': ['Kabeljauw (bereid)', 95, 21, 0, 1, 0, 0, [['moot', 125]]],
	'tonijn-water': ['Tonijn in water (uitgelekt)', 110, 25, 0, 1, 0, 0, [['blikje', 112]]],
	'garnalen': ['Garnalen', 85, 19, 0.5, 1, 0, 0, [['portie', 100]]],
	'makreel': ['Makreel gerookt', 290, 20, 0, 23, 0, 0, [['portie', 75]]],
	'tofu': ['Tofu', 125, 13, 1.5, 7.5, 1, 0.5, [['portie', 100]]],
	'tempeh': ['Tempeh', 195, 19, 7, 11, 5, 0, [['portie', 100]]],
	'vegaburger': ['Vegaburger', 210, 17, 8, 12, 4, 1.5, P.stuk(90)],
	'kikkererwten': ['Kikkererwten (uitgelekt)', 125, 7, 15, 2.5, 6, 0.5, [['portie', 100]]],
	'linzen': ['Linzen (gekookt)', 115, 9, 17, 0.5, 6, 1, [['portie', 100]]],
	'kidneybonen': ['Kidneybonen (uitgelekt)', 105, 7.5, 14, 0.5, 6.5, 0.5, [['portie', 100]]],
	'edamame': ['Edamame', 125, 11, 5, 5, 5, 2, [['portie', 100]]],

	// Graanproducten en aardappel (gekookt / bereid)
	'rijst-wit': ['Witte rijst (gekookt)', 130, 2.5, 28, 0.3, 0.4, 0, [['portie', 150]]],
	'rijst-zilvervlies': ['Zilvervliesrijst (gekookt)', 125, 2.8, 25, 1, 1.8, 0, [['portie', 150]]],
	'pasta': ['Pasta (gekookt)', 150, 5.5, 29, 0.9, 1.8, 0.5, [['portie', 180]]],
	'pasta-volkoren': ['Volkorenpasta (gekookt)', 145, 6, 26, 1.2, 4.5, 0.5, [['portie', 180]]],
	'pasta-droog': ['Pasta (ongekookt)', 355, 12.5, 70, 1.5, 3, 3, [['portie', 75]]],
	'rijst-droog': ['Rijst (ongekookt)', 355, 7, 79, 0.6, 1.3, 0, [['portie', 75]]],
	'couscous': ['Couscous (bereid)', 115, 4, 23, 0.3, 1.5, 0, [['portie', 150]]],
	'quinoa': ['Quinoa (gekookt)', 120, 4.4, 21, 1.9, 2.8, 0.9, [['portie', 150]]],
	'aardappel': ['Aardappelen (gekookt)', 80, 1.8, 17, 0.1, 1.8, 0.8, [['stuk', 70], ['portie', 200]]],
	'zoete-aardappel': ['Zoete aardappel (gekookt)', 85, 1.5, 18, 0.1, 3, 6, [['portie', 200]]],
	'friet': ['Friet', 300, 3.5, 38, 15, 3.5, 0.5, [['portie', 150]]],
	'noedels': ['Noedels (gekookt)', 140, 4.5, 26, 2, 1.2, 0.5, [['portie', 180]]],

	// Groente
	'broccoli': ['Broccoli (gekookt)', 30, 3, 2, 0.4, 3, 1.5, [['portie', 150]]],
	'sperziebonen': ['Sperziebonen (gekookt)', 30, 2, 3.5, 0.2, 3, 1.5, [['portie', 150]]],
	'spinazie': ['Spinazie (gekookt)', 25, 3, 0.5, 0.5, 2.5, 0.5, [['portie', 150]]],
	'wortel': ['Wortel', 35, 0.7, 6, 0.2, 2.8, 5, [['stuk', 80]]],
	'paprika': ['Paprika', 30, 1, 5, 0.3, 1.8, 4.5, P.stuk(150)],
	'tomaat': ['Tomaat', 20, 0.8, 3, 0.2, 1.2, 2.5, P.stuk(100)],
	'komkommer': ['Komkommer', 12, 0.6, 1.8, 0.1, 0.6, 1.7, [['stuk', 350]]],
	'sla': ['Sla', 15, 1.3, 1.5, 0.2, 1.3, 1, [['portie', 50]]],
	'champignons': ['Champignons', 25, 3, 0.5, 0.3, 2, 0.3, [['portie', 100]]],
	'courgette': ['Courgette', 20, 1.5, 2.5, 0.3, 1, 2, [['stuk', 250]]],
	'ui': ['Ui', 30, 1.2, 5.5, 0.1, 1.8, 4, P.stuk(100)],
	'doperwten': ['Doperwten (gekookt)', 75, 5.5, 9, 0.8, 5, 4, [['portie', 150]]],
	'mais': ['Maïs (blik, uitgelekt)', 90, 3, 16, 1.5, 2.5, 4, [['portie', 75]]],
	'avocado': ['Avocado', 200, 1.8, 2, 20, 6.5, 0.5, [['halve', 70]]],
	'roerbakgroente': ['Roerbakgroente', 30, 1.8, 3.5, 0.3, 2.5, 3, [['portie', 200]]],

	// Fruit
	'appel': ['Appel', 55, 0.3, 12, 0.2, 2.3, 11, P.stuk(150)],
	'banaan': ['Banaan', 95, 1.2, 21, 0.3, 2, 17, P.stuk(120)],
	'peer': ['Peer', 55, 0.4, 12, 0.1, 3, 10, P.stuk(160)],
	'sinaasappel': ['Sinaasappel', 45, 1, 9, 0.2, 2, 9, P.stuk(160)],
	'mandarijn': ['Mandarijn', 45, 0.8, 9.5, 0.2, 1.8, 9.5, P.stuk(70)],
	'aardbeien': ['Aardbeien', 35, 0.7, 6, 0.4, 2, 6, [['bakje', 250], ['handje', 80]]],
	'blauwe-bessen': ['Blauwe bessen', 55, 0.7, 12, 0.3, 2.5, 10, [['handje', 75]]],
	'druiven': ['Druiven', 70, 0.6, 16, 0.2, 1, 16, [['tros', 100]]],
	'kiwi': ['Kiwi', 55, 1, 10, 0.5, 3, 9, P.stuk(75)],
	'mango': ['Mango', 65, 0.8, 14, 0.4, 1.6, 14, [['halve', 150]]],
	'dadels': ['Dadels (gedroogd)', 290, 2.5, 66, 0.4, 7, 64, P.stuk(8)],
	'rozijnen': ['Rozijnen', 300, 3, 69, 0.5, 4, 66, [['handje', 30]]],
	'sinaasappelsap': ['Sinaasappelsap', 45, 0.7, 9.5, 0.1, 0.2, 9, P.glas],

	// Noten, vet, snacks
	'amandelen': ['Amandelen', 610, 22, 6, 52, 12, 4.5, [['handje', 25]]],
	'walnoten': ['Walnoten', 690, 15, 3, 66, 6.5, 2.5, [['handje', 25]]],
	'cashewnoten': ['Cashewnoten', 590, 18, 27, 46, 3.5, 6, [['handje', 25]]],
	'pinda-ongezouten': ['Pinda\'s (ongezouten)', 600, 26, 10, 49, 8, 4, [['handje', 25]]],
	'olijfolie': ['Olijfolie', 900, 0, 0, 100, 0, 0, P.el(10)],
	'pure-chocolade': ['Pure chocolade 70%', 580, 8, 33, 43, 11, 28, [['blokje', 10]]],
	'melkchocolade': ['Melkchocolade', 545, 7, 56, 32, 2, 54, [['blokje', 10]]],
	'chips': ['Chips naturel', 540, 6, 50, 34, 4.5, 0.5, [['zakje', 40]]],
	'stroopwafel': ['Stroopwafel', 455, 3.5, 66, 19, 1.5, 38, P.stuk(30)],
	'koek-ontbijt': ['Ontbijtkoek', 320, 4, 72, 1.5, 3, 40, [['plak', 25]]],
	'proteinereep': ['Proteïnereep (gemiddeld)', 380, 32, 33, 12, 6, 6, P.stuk(55)],

	// Sport en dranken
	'wei-eiwit': ['Wei-eiwit (poeder)', 385, 78, 6, 6, 0, 5, [['schep', 30]]],
	'creatine': ['Creatine monohydraat', 0, 0, 0, 0, 0, 0, [['schep', 5]]],
	'koffie': ['Koffie (zwart)', 2, 0.1, 0, 0, 0, 0, [['kop', 125]]],
	'cappuccino': ['Cappuccino (halfvolle melk)', 35, 2, 3, 1.2, 0, 3, [['kop', 180]]],
	'thee': ['Thee (zonder suiker)', 1, 0, 0.2, 0, 0, 0, [['kop', 200]]],
	'cola': ['Cola', 42, 0, 10.6, 0, 0, 10.6, [['blikje', 330], ['glas', 200]]],
	'cola-zero': ['Cola zero', 0.3, 0, 0, 0, 0, 0, [['blikje', 330]]],
	'bier': ['Bier (pils)', 42, 0.4, 3, 0, 0, 0, [['glas', 250], ['flesje', 300]]],
	'wijn': ['Wijn (rood)', 75, 0.1, 0.5, 0, 0, 0.5, [['glas', 125]]],

	// Sauzen
	'pesto': ['Pesto', 450, 5, 4, 45, 2, 2, P.el(15)],
	'mayonaise': ['Mayonaise', 700, 1, 2, 76, 0, 1.5, P.el(15)],
	'ketchup': ['Tomatenketchup', 105, 1.2, 23, 0.2, 0.7, 21, P.el(15)],
	'sojasaus': ['Sojasaus', 60, 8, 6, 0.5, 0.5, 2, P.el(15)],
	'pastasaus': ['Pastasaus (tomaat)', 55, 1.5, 8, 1.8, 1.5, 6, [['portie', 125]]],
	'suiker': ['Suiker', 400, 0, 100, 0, 0, 100, P.tl(5)]
};

export const BASISVOEDING = Object.entries(LIJST).map(([slug, [naam, kcal, eiwit, koolh, vet, vezels, suiker, porties = [], eenheid]]) => ({
	id: `basis:${slug}`,
	bron: 'basis',
	naam,
	kcal,
	eiwit,
	koolh,
	vet,
	vezels,
	suiker,
	eenheid: eenheid ?? (/melk|drink|sap|cola|bier|wijn|koffie|thee|cappuccino|karnemelk/i.test(naam) ? 'ml' : 'g'),
	porties
}));
