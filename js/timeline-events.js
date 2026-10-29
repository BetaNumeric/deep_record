function createTimelineEvents() {
  const bp = age => 1950 - age;
  const date = decimalYearFromYmd;
  const definitions = [];
  const band = (name, start, end, description, page, options = {}) =>
    definitions.push({ type: 0, name, start, end, description, page, approximate: true, ...options });
  const point = (name, start, description, page, options = {}) =>
    definitions.push({ type: 1, name, start, end: start, description, page, ...options });

  band('Age of the Universe', currentYear - 13800000000, currentYear,
    'The time since the early hot, expanding universe. This age is estimated from cosmological observations.',
    'Age_of_the_universe', { ongoing: true });
  band('Age of Earth', bp(4540000000), currentYear,
    'Earth formed as material gathered around the young Sun. Its age is estimated from radiometric dating.',
    'Age_of_Earth', { ongoing: true });
  band('Water on Earth', bp(4400000000), currentYear,
    'Ancient zircon minerals suggest liquid water was present this early. This is evidence of water, not an exact date for the first oceans.',
    'Origin_of_water_on_Earth', { ongoing: true });
  band('Single-celled life on Earth', bp(3800000000), currentYear,
    'Early evidence of microbial life. The oldest claimed traces and their interpretation remain debated.',
    'Earliest_known_life_forms', { ongoing: true });
  band('Dinosaurs', bp(230000000), bp(66000000),
    'The band follows non-avian dinosaurs, from their early fossils to the end-Cretaceous extinction. Birds are surviving dinosaurs.',
    'Dinosaur');

  band('Australopithecus', bp(4200000), bp(1200000),
    'A group of early human relatives in Africa. The band spans the approximate fossil record of the genus.', 'Australopithecus');
  band('Homo habilis', bp(2400000), bp(1400000),
    'An early human species known from African fossils. Its dates and the classification of some fossils are uncertain.', 'Homo_habilis');
  band('Homo erectus', bp(2000000), bp(100000),
    'An early human species that spread beyond Africa. The band shows a rounded range of its fossil record.', 'Homo_erectus');
  band('Homo sapiens', bp(300000), currentYear,
    'Our species has existed for roughly 300,000 years. This is an estimate from fossils, not a single moment when modern humans appeared.',
    'Homo_sapiens', { ongoing: true });
  band('Agricultural Revolution', -9999, -3999,
    'The gradual development and spread of farming. The band is a broad guide: agriculture began at different times in different regions.', 'Neolithic_Revolution');
  band('Written records', -3499, currentYear,
    'Early writing systems developed in the ancient Near East. Writing arose independently elsewhere; this band follows written records to the present.',
    'History_of_writing', { ongoing: true });
  band('Life of Confucius', -550, -478,
    'A Chinese thinker whose teachings influenced philosophy and society. These are the traditional dates of his life.', 'Confucius');
  band('Life of Muhammad', 570, 632,
    'The founder of Islam. His birth year is estimated; the band shows the commonly given lifespan.', 'Muhammad');
  band('Life of Jesus', -3, 30,
    'The central figure of Christianity. Estimates of his birth and death vary; the band uses one commonly cited range.', 'Chronology_of_Jesus');
  band('Crusades', 1095, 1291,
    'The main sequence of crusades to the eastern Mediterranean. Other campaigns called crusades took place outside this period.', 'Crusades');
  band('European Colonization', 1492, 1975,
    'A broad span from European expansion in the Americas to the main twentieth-century wave of decolonization. Dates vary by region; colonial territories and lasting effects remain.', 'Colonialism');
  band('Industrial Revolution', 1760, 1840,
    'The early shift to machine production, beginning in Britain. Industrialization continued and spread beyond this approximate period.', 'Industrial_Revolution');
  band('WWI', date(1914, 7, 28), date(1918, 11, 11),
    'World War I, from the first declaration of war to the armistice ending the main fighting. Peace treaties followed.',
    'World_War_I', { title: 'World War I', approximate: false, exactDate: true });
  band('WWII', date(1939, 9, 1), date(1945, 9, 2),
    'World War II, using the conventional dates from the invasion of Poland to Japan\'s formal surrender. Conflict in Asia began earlier.',
    'World_War_II', { title: 'World War II', approximate: false, exactDate: true });
  band('Cold War', 1947, 1991,
    'The prolonged rivalry between the United States and the Soviet Union and their allies. Its beginning is defined differently by different historians.', 'Cold_War');
  band('World Wide Web', 1989, currentYear,
    'Tim Berners-Lee proposed the Web in 1989. The Web is a way to link and access information over the Internet, which developed earlier.',
    'World_Wide_Web', { ongoing: true, approximate: false });

  point('Big Bang', currentYear - 13800000000,
    'The early hot, dense phase from which the universe expanded. This marker does not establish whether time itself had a beginning.',
    'Big_Bang', { approximate: true });
  point('Peak starbirth', bp(10000000000),
    'Stars were forming across the universe at their fastest overall rate around 10 billion years ago. This rounded marker represents a broad peak, often called cosmic noon; star formation was already underway and continues today.',
    'Star_formation', { approximate: true });
  point('Formation of the Moon', bp(4500000000),
    'The Moon likely formed after a giant collision involving the young Earth. Its age and the details of its formation are still studied.',
    'Origin_of_the_Moon', { approximate: true });
  point('Early life', bp(3500000000),
    'Microbial communities left layered structures called stromatolites around 3.5 billion years ago. This marker dates preserved fossil evidence; the origin of life may be older, as the single-celled-life band indicates.',
    'Stromatolite', { approximate: true });
  point('Oxygen Catastrophe', bp(2400000000),
    'Oxygen released by photosynthetic microbes began accumulating in the atmosphere, transforming conditions for life. Also called the Great Oxidation Event, this unfolded over a long period; the marker gives a rounded date for its onset.',
    'Great_Oxidation_Event', { approximate: true });
  point('Early seaweed', bp(1000000000),
    'Fossils of the small green alga Proterocladus antiquus in China date to around 1 billion years ago. They provide evidence of early multicellular seaweed; the marker dates these fossils rather than the origin of all algae.',
    'Proterocladus', { approximate: true });
  point('Snowball Earth', bp(720000000),
    'Earth experienced extreme glaciations during the Cryogenian, with ice reaching tropical latitudes. This marker gives a rounded date near the start of a series of episodes, not one continuous freeze.',
    'Snowball_Earth', { approximate: true });
  point('Early Forests', bp(390000000),
    'Fossil forests in southwest England date to around 390 million years ago. Early trees differed from modern forests; this marker dates surviving evidence, not the exact origin of forests.',
    'Evolutionary_history_of_plants', { approximate: true });
  point('Pangaea breaks apart', bp(175000000),
    'The supercontinent separated gradually as tectonic plates moved. This marker represents part of a long breakup, not a single event.',
    'Pangaea', { approximate: true });
  point('Asteroid impact', bp(66000000),
    'A large asteroid struck near today\'s Yucatan Peninsula, forming the Chicxulub crater. The impact is linked to the mass extinction that ended the age of non-avian dinosaurs.',
    'Chicxulub_crater', { approximate: true });
  point('Antarctic ice', bp(34000000),
    'Large, lasting ice sheets began developing in East Antarctica as global climate cooled. Ice did not cover the entire continent at once; glaciation spread toward West Antarctica later.',
    'Antarctic_ice_sheet', { approximate: true });
  point('Early apes', bp(25000000),
    'Rukwapithecus fossils from Tanzania are about 25 million years old and are interpreted as an early member of the ape lineage. This marker dates fossil evidence rather than an exact origin date for apes.',
    'Rukwapithecus', { approximate: true });
  point('Human–chimp split', bp(7000000),
    'The ancestors of humans and chimpanzees diverged from a shared population roughly 6–8 million years ago. This rounded marker represents a gradual population split. Both lineages continued evolving afterward.',
    'Chimpanzee–human_last_common_ancestor', { approximate: true });
  point('Stone Tools', bp(3300000),
    'Stone tools found at Lomekwi in Kenya are about 3.3 million years old. This dates surviving evidence, not the first use of any tool.',
    'Lomekwi', { approximate: true });
  point('Fire', bp(1000000),
    'Evidence suggests early humans used fire around this time. Controlled and habitual fire use developed gradually, and the earliest evidence is debated.',
    'Control_of_fire_by_early_humans', { approximate: true });
  point('Neanderthals', bp(400000),
    'Neanderthals appear in the fossil record roughly 400,000 years ago. Their populations lived across parts of Europe and Asia until around 40,000 years ago, overlapping in time with Homo sapiens and interbreeding with some of our ancestors.',
    'Neanderthal', { approximate: true });
  point('Jewellery', bp(142000),
    'Shell beads from Bizmoune Cave in Morocco were used as personal ornaments. Many come from deposits at least 142,000 years old. This marker dates surviving archaeological evidence rather than the exact invention of jewellery.',
    'Jewellery#History', { approximate: true });
  point('Cave paintings', bp(36500),
    'Chauvet Cave in France preserves paintings from an early period of human use around 36,500 years ago. This is a well-dated example of prehistoric cave art, not a date for the invention of painting.',
    'Chauvet_Cave', { approximate: true });
  point('Dogs', bp(14200),
    'Dog remains buried with two people at Bonn-Oberkassel, Germany, date to around 14,200 years ago. They document an established human-dog relationship, not the beginning of domestication, whose timing remains uncertain.',
    'Domestication_of_the_dog', { approximate: true });
  point('Wheel', -3499,
    'Wheeled transport appears in archaeological evidence around this time. Pottery wheels and other uses have their own histories.',
    'Wheel', { approximate: true });
  point('Great Pyramid of Giza', -2559,
    'Built in ancient Egypt during the reign of Khufu. Its construction dates are estimated from archaeological and historical evidence.',
    'Great_Pyramid_of_Giza', { approximate: true });
  point('Iron Tools', -1199,
    'Iron tools became more widespread around the start of the Iron Age in parts of the Near East. Ironworking began earlier and spread at different times.',
    'Iron_Age', { approximate: true });
  point('Fall of Rome', 476,
    'In 476 CE, Odoacer deposed Romulus Augustulus, conventionally regarded as the last Western Roman emperor. This marker represents the end of the Western Roman Empire, not the end of the city or of Roman civilization; the Eastern Roman Empire continued.',
    'Fall_of_the_Western_Roman_Empire', { title: 'Fall of the Western Roman Empire' });
  point('Printing Press', 1450,
    'Gutenberg developed movable-metal-type printing in Europe around this time. Printing and movable type already had earlier histories in Asia.',
    'Printing_press', { approximate: true });
  point('Calculus', 1665,
    'Newton began developing calculus in the 1660s; Leibniz developed it independently. Their work built on much earlier mathematical ideas.',
    'History_of_calculus', { approximate: true });
  point('Battery', 1800,
    'Alessandro Volta introduced the voltaic pile, an early battery that supplied a continuous electric current.', 'Alessandro_Volta');
  point('Telegraph', 1837,
    'Practical electric telegraph systems were developed in Britain and the United States. Earlier experiments preceded these systems.', 'Electrical_telegraph');
  point('Theory of Evolution', date(1859, 11, 24),
    'Darwin published On the Origin of Species, explaining evolution through natural selection. Wallace had independently developed a similar idea.',
    'On_the_Origin_of_Species', { exactDate: true });
  point('Car', date(1886, 1, 29),
    'Karl Benz patented his petrol-powered motor car. This marker refers to that milestone, not all earlier self-propelled vehicles.',
    'Benz_Patent-Motorwagen', { exactDate: true });
  point('Airplane', date(1903, 12, 17),
    'The Wright brothers made sustained, controlled powered flights at Kitty Hawk. Earlier gliders and flight experiments came before them.',
    'Wright_brothers', { exactDate: true });
  point('TV', 1927,
    'Philo Farnsworth demonstrated an electronic television system. Mechanical television and other experiments had already been developed.',
    'History_of_television', { title: 'Television' });
  point('Computer', 1938,
    'Konrad Zuse completed the Z1, an early programmable mechanical computer. Computing has many earlier and later milestones.', 'Z1_(computer)');
  point('Moon Landing', date(1969, 7, 20),
    'Apollo 11 made the first crewed landing on the Moon. Armstrong and Aldrin explored the surface while Collins remained in lunar orbit.',
    'Apollo_11', { exactDate: true });
  point('Fall of Berlin Wall', date(1989, 11, 9),
    'East Germany opened border crossings through the Berlin Wall, a major milestone in the end of the Cold War.',
    'Fall_of_the_Berlin_Wall', { exactDate: true });
  point('9/11', date(2001, 9, 11),
    'Coordinated terrorist attacks in the United States. The date is a familiar landmark in recent world history.',
    'September_11_attacks', { title: 'September 11 attacks', exactDate: true });
  point('Financial crisis', date(2008, 9, 15),
    'Lehman Brothers filed for bankruptcy on 15 September 2008, a major escalation of the global financial crisis. This point dates that bankruptcy; the broader crisis developed over 2007–2009.',
    'Bankruptcy_of_Lehman_Brothers', { title: 'Financial crisis: Lehman Brothers bankruptcy', exactDate: true });
  point('Paris Agreement', date(2015, 12, 12),
    'Countries adopted the Paris climate agreement. It entered into force in 2016; adoption alone does not mark an immediate change in emissions.',
    'Paris_Agreement', { title: 'Paris Agreement adopted', exactDate: true });
  point('COVID-19', date(2020, 1, 30),
    'WHO declared a global health emergency, which ended in May 2023. This marker dates that declaration, not the first infections or the end of COVID-19.',
    'COVID-19_pandemic', { title: 'COVID-19 global health emergency', exactDate: true });

  event = definitions.map(definition => new TimelineEvent(definition));
  createTimelineEventControls();
}
