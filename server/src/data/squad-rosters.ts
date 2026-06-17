export interface RosterLine {
  gk: string[];
  def: string[];
  mid: string[];
  fwd: string[];
}

/**
 * Финальные заявки ЧМ-2026 (26 игроков, 48 сборных).
 * Источник: https://worldcupstats.football/ru/squads/ (июнь 2026).
 */
export const TEAM_ROSTERS: Record<string, RosterLine> = {
  alg: {
    gk: ['Melvin Mastil', 'Oussama Benbot', 'Luca Zidane'],
    def: ['Aïssa Mandi', 'Achref Abada', 'Mohamed Amine Tougai', 'Zineddine Belaïd', 'Jaouen Hadjam', 'Rayan Aït-Nouri', 'Rafik Belghali', 'Ramy Bensebaini', 'Samir Chergui'],
    mid: ['Ramiz Zerrouki', 'Houssem Aouar', 'Farès Chaïbi', 'Hicham Boudaoui', 'Nabil Bentaleb', 'Ibrahim Maza', 'Yacine Titraoui'],
    fwd: ['Riyad Mahrez', 'Amine Gouiri', 'Anis Hadj Moussa', 'Nadhir Benbouali', 'Mohamed Amoura', 'Adil Boulbina', 'Farès Ghedjemis'],
  },
  arg: {
    gk: ['Juan Musso', 'Gerónimo Rulli', 'Emiliano Martínez'],
    def: ['Leonardo Balerdi', 'Nicolás Tagliafico', 'Gonzalo Montiel', 'Lisandro Martínez', 'Cristian Romero', 'Nicolás Otamendi', 'Facundo Medina', 'Nahuel Molina'],
    mid: ['Leandro Paredes', 'Rodrigo De Paul', 'Valentín Barco', 'Giovani Lo Celso', 'Exequiel Palacios', 'Nicolás González', 'Alexis Mac Allister', 'Enzo Fernández'],
    fwd: ['Julián Alvarez', 'Lionel Messi', 'Thiago Almada', 'Giuliano Simeone', 'Nico Paz', 'José Manuel López', 'Lautaro Martínez'],
  },
  aus: {
    gk: ['Mathew Ryan', 'Paul Izzo', 'Patrick Beach'],
    def: ['Miloš Degenek', 'Alessandro Circati', 'Jacob Italiano', 'Jordan Bos', 'Jason Geria', 'Kai Trewin', 'Aziz Behich', 'Harry Souttar', 'Cameron Burgess', 'Lucas Herrington'],
    mid: ['Connor Metcalfe', 'Aiden O\'Neill', 'Cammy Devlin', 'Jackson Irvine', 'Paul Okon-Engstler'],
    fwd: ['Mathew Leckie', 'Mohamed Touré', 'Ajdin Hrustic', 'Awer Mabil', 'Nestory Irankunda', 'Cristian Volpato', 'Nishan Velupillay', 'Tete Yengi'],
  },
  aut: {
    gk: ['Alexander Schlager', 'Florian Wiegele', 'Patrick Pentz'],
    def: ['David Affengruber', 'Kevin Danso', 'Stefan Posch', 'David Alaba', 'Philipp Lienhart', 'Phillipp Mwene', 'Marco Friedl', 'Michael Svoboda'],
    mid: ['Xaver Schlager', 'Nicolas Seiwald', 'Marcel Sabitzer', 'Florian Grillitsch', 'Carney Chukwuemeka', 'Romano Schmid', 'Christoph Baumgartner', 'Konrad Laimer', 'Alexander Prass', 'Paul Wanner', 'Alessandro Schöpf'],
    fwd: ['Marko Arnautović', 'Michael Gregoritsch', 'Saša Kalajdžić', 'Patrick Wimmer'],
  },
  bel: {
    gk: ['Thibaut Courtois', 'Senne Lammens', 'Mike Penders'],
    def: ['Zeno Debast', 'Arthur Theate', 'Brandon Mechele', 'Maxim De Cuyper', 'Thomas Meunier', 'Koni De Winter', 'Joaquin Seys', 'Timothy Castagne', 'Nathan Ngoy'],
    mid: ['Axel Witsel', 'Kevin De Bruyne', 'Youri Tielemans', 'Diego Moreira', 'Hans Vanaken', 'Alexis Saelemaekers', 'Nicolas Raskin', 'Amadou Onana'],
    fwd: ['Romelu Lukaku', 'Leandro Trossard', 'Jérémy Doku', 'Dodi Lukébakio', 'Charles De Ketelaere', 'Matias Fernandez-Pardo'],
  },
  bih: {
    gk: ['Nikola Vasilj', 'Mladen Jurkas', 'Martin Zlomislić'],
    def: ['Nihad Mujakić', 'Dennis Hadžikadunić', 'Tarik Muharemović', 'Sead Kolašinac', 'Amar Dedić', 'Nikola Katić', 'Stjepan Radeljić', 'Nidal Čelik'],
    mid: ['Benjamin Tahirović', 'Armin Gigović', 'Ivan Bašić', 'Ivan Šunjić', 'Amar Memić', 'Amir Hadžiahmetović', 'Dženis Burnić', 'Ermin Mahmić'],
    fwd: ['Samed Baždar', 'Ermedin Demirović', 'Edin Džeko', 'Kerim Alajbegović', 'Esmir Bajraktarević', 'Haris Tabaković', 'Jovo Lukić'],
  },
  bra: {
    gk: ['Alisson', 'Weverton', 'Ederson'],
    def: ['Gabriel Magalhães', 'Marquinhos', 'Alex Sandro', 'Danilo Luiz', 'Bremer', 'Léo Pereira', 'Douglas Santos', 'Roger Ibañez'],
    mid: ['Éderson', 'Casemiro', 'Bruno Guimarães', 'Fabinho', 'Danilo Santos', 'Lucas Paquetá'],
    fwd: ['Vinícius Júnior', 'Matheus Cunha', 'Neymar', 'Raphinha', 'Endrick', 'Luiz Henrique', 'Gabriel Martinelli', 'Igor Thiago', 'Rayan'],
  },
  can: {
    gk: ['Dayne St. Clair', 'Maxime Crépeau', 'Owen Goodman'],
    def: ['Moïse Bombito', 'Derek Cornelius', 'Alphonso Davies', 'Luc De Fougerolles', 'Alistair Johnston', 'Alfie Jones', 'Richie Laryea', 'Niko Sigur', 'Joel Waterman'],
    mid: ['Ali Ahmed', 'Tajon Buchanan', 'Mathieu Choinière', 'Stephen Eustáquio', 'Marcelo Flores', 'Ismaël Koné', 'Liam Millar', 'Jonathan Osorio', 'Nathan Saliba', 'Jacob Shaffelburg'],
    fwd: ['Jonathan David', 'Promise David', 'Cyle Larin', 'Tani Oluwaseyi'],
  },
  civ: {
    gk: ['Yahia Fofana', 'Mohamed Koné', 'Alban Lafont'],
    def: ['Ousmane Diomande', 'Ghislain Konan', 'Wilfried Singo', 'Odilon Kossounou', 'Christopher Opéri', 'Guéla Doué', 'Emmanuel Agbadou', 'Evan Ndicka'],
    mid: ['Jean Michaël Seri', 'Seko Fofana', 'Franck Kessié', 'Ibrahim Sangaré', 'Parfait Guiagon', 'Christ Inao Oulaï'],
    fwd: ['Ange-Yoan Bonny', 'Simon Adingra', 'Yan Diomande', 'Elye Wahi', 'Oumar Diakité', 'Amad Diallo', 'Nicolas Pépé', 'Evann Guessand', 'Bazoumana Touré'],
  },
  cod: {
    gk: ['Lionel Mpasi', 'Timothy Fayulu', 'Matthieu Epolo'],
    def: ['Aaron Wan-Bissaka', 'Steve Kapuadi', 'Axel Tuanzebe', 'Dylan Batubinsika', 'Joris Kayembe', 'Chancel Mbemba', 'Gédéon Kalulu', 'Arthur Masuaku'],
    mid: ['Ngal\'ayel Mukau', 'Nathanaël Mbuku', 'Samuel Moutoussamy', 'Théo Bongonda', 'Noah Sadiki', 'Aaron Tshibola', 'Charles Pickel', 'Edo Kayembe'],
    fwd: ['Brian Cipenga', 'Gaël Kakuta', 'Meschak Elia', 'Cédric Bakambu', 'Fiston Mayele', 'Yoane Wissa', 'Simon Banza'],
  },
  col: {
    gk: ['David Ospina', 'Camilo Vargas', 'Álvaro Montero'],
    def: ['Daniel Muñoz', 'Jhon Lucumí', 'Santiago Arias', 'Yerry Mina', 'Gustavo Puerta', 'Johan Mojica', 'Willer Ditta', 'Deiver Machado', 'Davinson Sánchez'],
    mid: ['Kevin Castaño', 'Richard Ríos', 'Jorge Carrascal', 'James Rodríguez', 'Jhon Arias', 'Juan Portilla', 'Jefferson Lerma', 'Juan Fernando Quintero'],
    fwd: ['Luis Díaz', 'Jhon Córdoba', 'Cucho Hernández', 'Jaminton Campaz', 'Luis Suárez', 'Andrés Gómez'],
  },
  cpv: {
    gk: ['Vozinha', 'Márcio Rosa', 'CJ dos Santos'],
    def: ['Stopira', 'Diney', 'Roberto Lopes', 'Logan Costa', 'Sidny Lopes Cabral', 'Steven Moreira', 'Wagner Pina', 'Kelvin Pires'],
    mid: ['Kevin Pina', 'Jovane Cabral', 'João Paulo', 'Jamiro Monteiro', 'Garry Rodrigues', 'Deroy Duarte', 'Laros Duarte', 'Yannick Semedo', 'Willy Semedo', 'Telmo Arcanjo', 'Nuno da Costa', 'Hélio Varela'],
    fwd: ['Gilson Benchimol', 'Dailon Livramento', 'Ryan Mendes'],
  },
  cro: {
    gk: ['Dominik Livaković', 'Ivor Pandur', 'Dominik Kotarski'],
    def: ['Josip Stanišić', 'Marin Pongračić', 'Joško Gvardiol', 'Duje Ćaleta-Car', 'Josip Šutalo', 'Kristijan Jakić', 'Luka Vušković', 'Martin Erlić'],
    mid: ['Nikola Moro', 'Mateo Kovačić', 'Luka Modrić', 'Nikola Vlašić', 'Mario Pašalić', 'Martin Baturina', 'Petar Sučić', 'Toni Fruk', 'Luka Sučić'],
    fwd: ['Andrej Kramarić', 'Ante Budimir', 'Ivan Perišić', 'Igor Matanović', 'Marco Pašalić', 'Petar Musa'],
  },
  cuw: {
    gk: ['Eloy Room', 'Tyrick Bodak', 'Trevor Doornbusch'],
    def: ['Shurandy Sambo', 'Juriën Gaari', 'Roshon van Eijma', 'Sherel Floranus', 'Armando Obispo', 'Joshua Brenet', 'Riechedly Bazoer', 'Deveron Fonville'],
    mid: ['Godfried Roemeratoe', 'Juninho Bacuna', 'Livano Comenencia', 'Leandro Bacuna', 'Ar\'jany Martha', 'Tahith Chong', 'Kevin Felida'],
    fwd: ['Jürgen Locadia', 'Jeremy Antonisse', 'Sontje Hansen', 'Tyrese Noslin', 'Kenji Gorré', 'Jearl Margaritha', 'Brandley Kuwas', 'Gervane Kastaneer'],
  },
  cze: {
    gk: ['Matěj Kovář', 'Jindřich Staněk', 'Lukáš Horníček'],
    def: ['David Zima', 'Tomáš Holeš', 'Robin Hranáč', 'Vladimír Coufal', 'Štěpán Chaloupek', 'Ladislav Krejčí', 'David Jurásek', 'Jaroslav Zelený', 'David Douděra'],
    mid: ['Vladimír Darida', 'Lukáš Červ', 'Lukáš Provod', 'Michal Sadílek', 'Tomáš Souček', 'Alexandr Sojka', 'Hugo Sochůrek'],
    fwd: ['Adam Hložek', 'Patrik Schick', 'Jan Kuchta', 'Mojmír Chytil', 'Pavel Šulc', 'Tomáš Chorý', 'Denis Višinský'],
  },
  ecu: {
    gk: ['Hernán Galíndez', 'Moisés Ramírez', 'Gonzalo Valle'],
    def: ['Félix Torres', 'Piero Hincapié', 'Joel Ordóñez', 'Willian Pacho', 'Pervis Estupiñán', 'Ángelo Preciado', 'Jackson Porozo', 'Yaimar Medina'],
    mid: ['Jordy Alcívar', 'Anthony Valencia', 'Kendry Páez', 'Alan Minda', 'Pedro Vite', 'Denil Castillo', 'Alan Franco', 'Moisés Caicedo'],
    fwd: ['John Yeboah', 'Kevin Rodríguez', 'Enner Valencia', 'Jordy Caicedo', 'Gonzalo Plata', 'Nilson Angulo', 'Jeremy Arévalo'],
  },
  egy: {
    gk: ['Mohamed El Shenawy', 'El Mahdy Soliman', 'Mostafa Shobeir', 'Mohamed Alaa'],
    def: ['Yasser Ibrahim', 'Mohamed Hany', 'Hossam Abdelmaguid', 'Ramy Rabia', 'Mohamed Abdelmonem', 'Ahmed Fatouh', 'Karim Hafez', 'Tarek Alaa'],
    mid: ['Emam Ashour', 'Mostafa Ziko', 'Hamdy Fathy', 'Mohanad Lasheen', 'Nabil Emad', 'Marwan Attia', 'Mahmoud Saber'],
    fwd: ['Trézéguet', 'Hamza Abdelkarim', 'Mohamed Salah', 'Haissem Hassan', 'Ibrahim Adel', 'Omar Marmoush', 'Zizo'],
  },
  eng: {
    gk: ['Jordan Pickford', 'Dean Henderson', 'James Trafford'],
    def: ['Ezri Konsa', 'Nico O\'Reilly', 'John Stones', 'Marc Guéhi', 'Tino Livramento', 'Dan Burn', 'Reece James', 'Djed Spence', 'Jarell Quansah'],
    mid: ['Declan Rice', 'Elliot Anderson', 'Jude Bellingham', 'Jordan Henderson', 'Kobbie Mainoo', 'Morgan Rogers', 'Eberechi Eze'],
    fwd: ['Bukayo Saka', 'Harry Kane', 'Marcus Rashford', 'Anthony Gordon', 'Ollie Watkins', 'Noni Madueke', 'Ivan Toney'],
  },
  esp: {
    gk: ['David Raya', 'Joan Garcia', 'Unai Simón'],
    def: ['Marc Pubill', 'Álex Grimaldo', 'Eric García', 'Marcos Llorente', 'Pedro Porro', 'Aymeric Laporte', 'Pau Cubarsí', 'Marc Cucurella'],
    mid: ['Mikel Merino', 'Fabián Ruiz', 'Gavi', 'Álex Baena', 'Rodri', 'Martín Zubimendi', 'Pedri'],
    fwd: ['Ferran Torres', 'Dani Olmo', 'Yéremy Pino', 'Nico Williams', 'Lamine Yamal', 'Mikel Oyarzabal', 'Víctor Muñoz', 'Borja Iglesias'],
  },
  fra: {
    gk: ['Brice Samba', 'Mike Maignan', 'Robin Risser'],
    def: ['Malo Gusto', 'Lucas Digne', 'Dayot Upamecano', 'Jules Koundé', 'Ibrahima Konaté', 'William Saliba', 'Théo Hernandez', 'Lucas Hernandez', 'Maxence Lacroix'],
    mid: ['Manu Koné', 'Aurélien Tchouaméni', 'N\'Golo Kanté', 'Adrien Rabiot', 'Warren Zaïre-Emery', 'Rayan Cherki', 'Maghnes Akliouche'],
    fwd: ['Ousmane Dembélé', 'Marcus Thuram', 'Kylian Mbappé', 'Michael Olise', 'Bradley Barcola', 'Désiré Doué', 'Jean-Philippe Mateta'],
  },
  ger: {
    gk: ['Manuel Neuer', 'Oliver Baumann', 'Alexander Nübel'],
    def: ['Antonio Rüdiger', 'Waldemar Anton', 'Jonathan Tah', 'Joshua Kimmich', 'Nico Schlotterbeck', 'Nathaniel Brown', 'David Raum', 'Malick Thiaw'],
    mid: ['Aleksandar Pavlović', 'Leon Goretzka', 'Jamie Leweling', 'Jamal Musiala', 'Pascal Groß', 'Angelo Stiller', 'Florian Wirtz', 'Leroy Sané', 'Nadiem Amiri', 'Felix Nmecha', 'Assan Ouédraogo'],
    fwd: ['Kai Havertz', 'Nick Woltemade', 'Maximilian Beier', 'Deniz Undav'],
  },
  gha: {
    gk: ['Lawrence Ati-Zigi', 'Joseph Anang', 'Benjamin Asare'],
    def: ['Alidu Seidu', 'Jonas Adjetey', 'Abdul Mumin', 'Gideon Mensah', 'Abdul Rahman Baba', 'Jerome Opoku', 'Kojo Peprah Oppong', 'Derrick Luckassen', 'Marvin Senaya'],
    mid: ['Caleb Yirenkyi', 'Thomas Partey', 'Kwasi Sibo', 'Antoine Semenyo', 'Elisha Owusu', 'Augustine Boakye'],
    fwd: ['Abdul Fatawu', 'Jordan Ayew', 'Brandon Thomas-Asante', 'Christopher Bonsu Baah', 'Iñaki Williams', 'Kamaldeen Sulemana', 'Ernest Nuamah', 'Prince Kwabena Adu'],
  },
  hai: {
    gk: ['Johny Placide', 'Alexandre Pierre', 'Josué Duverger'],
    def: ['Carlens Arcus', 'Keeto Thermoncy', 'Ricardo Adé', 'Hannes Delcroix', 'Martin Expérience', 'Duke Lacroix', 'Jean-Kévin Duverne', 'Wilguens Paugain'],
    mid: ['Carl Sainté', 'Jean-Ricner Bellegarde', 'Leverton Pierre', 'Danley Jean Jacques', 'Dominique Simon', 'Woodensky Pierre'],
    fwd: ['Derrick Etienne Jr.', 'Duckens Nazon', 'Louicius Deedson', 'Ruben Providence', 'Lenny Joseph', 'Wilson Isidor', 'Yassin Fortuné', 'Frantzdy Pierrot', 'Josué Casimir'],
  },
  irn: {
    gk: ['Alireza Beiranvand', 'Payam Niazmand', 'Hossein Hosseini'],
    def: ['Saleh Hardani', 'Ehsan Hajsafi', 'Shojae Khalilzadeh', 'Milad Mohammadi', 'Hossein Kanaanizadegan', 'Aria Yousefi', 'Ali Nemati', 'Ramin Rezaeian', 'Danial Eiri'],
    mid: ['Saeid Ezatolahi', 'Alireza Jahanbakhsh', 'Mohammad Mohebi', 'Saman Ghoddos', 'Rouzbeh Cheshmi', 'Mehdi Torabi', 'Mohammad Ghorbani', 'Amirmohammad Razzaghinia'],
    fwd: ['Mehdi Taremi', 'Mehdi Ghayedi', 'Ali Alipour', 'Amirhossein Hosseinzadeh', 'Shahriyar Moghanlou', 'Dennis Eckert'],
  },
  irq: {
    gk: ['Fahad Talib', 'Jalal Hassan', 'Ahmed Basil'],
    def: ['Rebin Sulaka', 'Hussein Ali', 'Zaid Tahseen', 'Akam Hashim', 'Manaf Younis', 'Ahmed Yahya', 'Merchas Doski', 'Mustafa Saadoon', 'Frans Putros'],
    mid: ['Youssef Amyn', 'Ibrahim Bayesh', 'Zidane Iqbal', 'Amir Al-Ammari', 'Kevin Yakob', 'Aimar Sher', 'Zaid Ismail'],
    fwd: ['Ali Al-Hamadi', 'Mohanad Ali', 'Ahmed Qasem', 'Ali Yousif', 'Ali Jasim', 'Aymen Hussein', 'Marko Farji'],
  },
  jor: {
    gk: ['Yazeed Abulaila', 'Nour Bani Attiah', 'Abdallah Al-Fakhouri'],
    def: ['Mohammad Abu Hashish', 'Abdallah Nasib', 'Husam Abu Dahab', 'Yazan Al-Arab', 'Mo Abualnadi', 'Salim Obaid', 'Saed Al-Rosan', 'Ihsan Haddad', 'Anas Badawi'],
    mid: ['Amer Jamous', 'Noor Al-Rawabdeh', 'Rajaei Ayed', 'Ibrahim Sadeh', 'Mohannad Abu Taha', 'Nizar Al-Rashdan', 'Mohammad Al-Dawoud'],
    fwd: ['Mohammad Abu Zrayq', 'Ali Olwan', 'Musa Al-Taamari', 'Odeh Al-Fakhouri', 'Mahmoud Al-Mardi', 'Ibrahim Sabra', 'Ali Azaizeh'],
  },
  jpn: {
    gk: ['Zion Suzuki', 'Keisuke Ōsako', 'Tomoki Hayakawa'],
    def: ['Yukinari Sugawara', 'Shōgo Taniguchi', 'Kō Itakura', 'Yūto Nagatomo', 'Tsuyoshi Watanabe', 'Ayumu Seko', 'Hiroki Itō', 'Takehiro Tomiyasu', 'Junnosuke Suzuki'],
    mid: ['Wataru Endo', 'Ao Tanaka', 'Takefusa Kubo', 'Ritsu Dōan', 'Daizen Maeda', 'Keito Nakamura', 'Junya Itō', 'Daichi Kamada', 'Yuito Suzuki', 'Kaishū Sano'],
    fwd: ['Keisuke Gotō', 'Ayase Ueda', 'Kōki Ogawa', 'Kento Shiogai'],
  },
  kor: {
    gk: ['Kim Seung-gyu', 'Song Bum-keun', 'Jo Hyeon-woo'],
    def: ['Lee Han-beom', 'Kim Min-jae', 'Kim Tae-hyeon', 'Lee Tae-seok', 'Cho Wi-je', 'Kim Moon-hwan', 'Park Jin-seob', 'Seol Young-woo', 'Jens Castrop'],
    mid: ['Lee Ki-hyuk', 'Hwang In-beom', 'Paik Seung-ho', 'Lee Jae-sung', 'Hwang Hee-chan', 'Bae Jun-ho', 'Lee Kang-in', 'Yang Hyun-jun', 'Kim Jin-gyu', 'Eom Ji-sung', 'Lee Dong-gyeong'],
    fwd: ['Son Heung-min', 'Cho Gue-sung', 'Oh Hyeon-gyu'],
  },
  ksa: {
    gk: ['Nawaf Al-Aqidi', 'Mohammed Al-Owais', 'Ahmed Al-Kassar'],
    def: ['Ali Majrashi', 'Ali Lajami', 'Abdulelah Al-Amri', 'Hassan Al-Tambakti', 'Saud Abdulhamid', 'Nawaf Boushal', 'Hassan Kadesh', 'Moteb Al-Harbi', 'Jehad Thakri', 'Mohammed Abu Al-Shamat'],
    mid: ['Nasser Al-Dawsari', 'Musab Al-Juwayr', 'Abdullah Al-Khaibari', 'Ziyad Al-Johani', 'Alaa Al-Hejji', 'Mohamed Kanno'],
    fwd: ['Ayman Yahya', 'Firas Al-Buraikan', 'Salem Al-Dawsari', 'Saleh Al-Shehri', 'Khalid Al-Ghannam', 'Abdullah Al-Hamdan', 'Sultan Mandash'],
  },
  mar: {
    gk: ['Yassine Bounou', 'Munir Mohamedi', 'Ahmed Reda Tagnaouti'],
    def: ['Achraf Hakimi', 'Noussair Mazraoui', 'Nayef Aguerd', 'Zakaria El Ouahdi', 'Issa Diop', 'Chadi Riad', 'Youssef Belammari', 'Redouane Halhal', 'Anass Salah-Eddine'],
    mid: ['Sofyan Amrabat', 'Ayyoub Bouaddi', 'Chemsdine Talbi', 'Azzedine Ounahi', 'Ismael Saibari', 'Samir El Mourabet', 'Gessime Yassine', 'Bilal El Khannouss', 'Neil El Aynaoui'],
    fwd: ['Soufiane Rahimi', 'Brahim Díaz', 'Abde Ezzalzouli', 'Ayoub El Kaabi', 'Ayoube Amaimouni'],
  },
  mex: {
    gk: ['Raúl Rangel', 'Carlos Acevedo', 'Guillermo Ochoa'],
    def: ['Jorge Sánchez', 'César Montes', 'Edson Álvarez', 'Johan Vásquez', 'Israel Reyes', 'Mateo Chávez', 'Jesús Gallardo'],
    mid: ['Érik Lira', 'Luis Romo', 'Álvaro Fidalgo', 'Orbelín Pineda', 'Obed Vargas', 'Gilberto Mora', 'Luis Chávez', 'Brian Gutiérrez'],
    fwd: ['Raúl Jiménez', 'Alexis Vega', 'Santiago Giménez', 'Armando González', 'Julián Quiñones', 'César Huerta', 'Guillermo Martínez', 'Roberto Alvarado'],
  },
  ned: {
    gk: ['Bart Verbruggen', 'Robin Roefs', 'Mark Flekken'],
    def: ['Lutsharel Geertruida', 'Virgil van Dijk', 'Nathan Aké', 'Jan Paul van Hecke', 'Mats Wieffer', 'Micky van de Ven', 'Denzel Dumfries', 'Jorrel Hato'],
    mid: ['Marten de Roon', 'Justin Kluivert', 'Ryan Gravenberch', 'Tijjani Reijnders', 'Guus Til', 'Teun Koopmeiners', 'Frenkie de Jong', 'Quinten Timber'],
    fwd: ['Wout Weghorst', 'Memphis Depay', 'Cody Gakpo', 'Noa Lang', 'Donyell Malen', 'Brian Brobbey', 'Crysencio Summerville'],
  },
  nor: {
    gk: ['Ørjan Nyland', 'Sander Tangvik', 'Egil Selvik'],
    def: ['Kristoffer Ajer', 'Leo Østigård', 'David Møller Wolfe', 'Fredrik André Bjørkan', 'Marcus Holmgren Pedersen', 'Torbjørn Heggem', 'Sondre Langås', 'Henrik Falchener', 'Julian Ryerson'],
    mid: ['Morten Thorsby', 'Patrick Berg', 'Sander Berge', 'Martin Ødegaard', 'Fredrik Aursnes', 'Kristian Thorstvedt', 'Thelo Aasgaard', 'Andreas Schjelderup', 'Oscar Bobb', 'Jens Petter Hauge'],
    fwd: ['Alexander Sørloth', 'Erling Haaland', 'Jørgen Strand Larsen', 'Antonio Nusa'],
  },
  nzl: {
    gk: ['Max Crocombe', 'Alex Paulsen', 'Michael Woud'],
    def: ['Tim Payne', 'Francis de Vries', 'Tyler Bindon', 'Michael Boxall', 'Liberato Cacace', 'Nando Pijnaker', 'Finn Surman', 'Callan Elliot', 'Tommy Smith'],
    mid: ['Joe Bell', 'Matthew Garbett', 'Marko Stamenić', 'Sarpreet Singh', 'Elijah Just', 'Alex Rufer', 'Ben Old', 'Callum McCowatt', 'Ryan Thomas', 'Lachlan Bayliss'],
    fwd: ['Chris Wood', 'Kosta Barbarouses', 'Ben Waine', 'Jesse Randall'],
  },
  pan: {
    gk: ['Luis Mejía', 'César Samudio', 'Orlando Mosquera'],
    def: ['César Blackman', 'José Córdoba', 'Fidel Escobar', 'Edgardo Fariña', 'Jiovany Ramos', 'Carlos Harvey', 'Eric Davis', 'Andrés Andrade', 'Michael Amir Murillo', 'Roderick Miller', 'Jorge Gutiérrez'],
    mid: ['Cristian Martínez', 'José Luis Rodríguez', 'Adalberto Carrasquilla', 'Ismael Díaz', 'Yoel Bárcenas', 'Alberto Quintero', 'Aníbal Godoy', 'César Yanis'],
    fwd: ['Tomás Rodríguez', 'José Fajardo', 'Cecilio Waterman', 'Azarias Londoño'],
  },
  par: {
    gk: ['Gatito Fernández', 'Orlando Gill', 'Gastón Olveira'],
    def: ['Gustavo Velázquez', 'Omar Alderete', 'Juan José Cáceres', 'Fabián Balbuena', 'Júnior Alonso', 'José Canale', 'Gustavo Gómez', 'Alexandro Maidana'],
    mid: ['Ramón Sosa', 'Diego Gómez', 'Miguel Almirón', 'Maurício', 'Andrés Cubas', 'Damián Bobadilla', 'Braian Ojeda', 'Matías Galarza', 'Gustavo Caballero'],
    fwd: ['Antonio Sanabria', 'Kaku', 'Álex Arce', 'Julio Enciso', 'Gabriel Ávalos', 'Isidro Pitta'],
  },
  por: {
    gk: ['Diogo Costa', 'José Sá', 'Rui Silva'],
    def: ['Nélson Semedo', 'Rúben Dias', 'Tomás Araújo', 'Diogo Dalot', 'Renato Veiga', 'Gonçalo Inácio', 'João Cancelo', 'Samú Costa', 'Nuno Mendes'],
    mid: ['Matheus Nunes', 'Bruno Fernandes', 'Bernardo Silva', 'João Neves', 'Rúben Neves', 'Vitinha'],
    fwd: ['Cristiano Ronaldo', 'Gonçalo Ramos', 'João Félix', 'Francisco Trincão', 'Rafael Leão', 'Pedro Neto', 'Gonçalo Guedes', 'Francisco Conceição'],
  },
  qat: {
    gk: ['Mahmud Abunada', 'Salah Zakaria', 'Meshaal Barsham'],
    def: ['Pedro Miguel', 'Lucas Mendes', 'Issa Laye', 'Jassem Gaber', 'Ayoub Al-Oui', 'Homam Ahmed', 'Boualem Khoukhi', 'Sultan Al-Brake', 'Al-Hashmi Al-Hussain'],
    mid: ['Abdulaziz Hatem', 'Karim Boudiaf', 'Ahmed Al-Ganehi', 'Ahmed Fathy', 'Assim Madibo'],
    fwd: ['Ahmed Alaaeldin', 'Edmilson Junior', 'Mohammed Muntari', 'Hassan Al-Haydos', 'Akram Afif', 'Yusuf Abdurisag', 'Almoez Ali', 'Tahsin Jamshid', 'Mohamed Manai'],
  },
  rsa: {
    gk: ['Ronwen Williams', 'Sipho Chaine', 'Ricardo Goss'],
    def: ['Thabang Matuludi', 'Khulumani Ndamane', 'Aubrey Modiba', 'Mbekezeli Mbokazi', 'Samukele Kabini', 'Nkosinathi Sibisi', 'Khuliso Mudau', 'Ime Okon', 'Olwethu Makhanya', 'Bradley Cross'],
    mid: ['Teboho Mokoena', 'Thalente Mbatha', 'Themba Zwane', 'Sphephelo Sithole', 'Jayden Adams'],
    fwd: ['Oswin Appollis', 'Tshepang Moremi', 'Lyle Foster', 'Relebohile Mofokeng', 'Thapelo Maseko', 'Iqraam Rayners', 'Evidence Makgopa', 'Kamogelo Sebelebele'],
  },
  sco: {
    gk: ['Angus Gunn', 'Liam Kelly', 'Craig Gordon'],
    def: ['Aaron Hickey', 'Andy Robertson', 'Grant Hanley', 'Kieran Tierney', 'Jack Hendry', 'John Souttar', 'Dominic Hyam', 'Nathan Patterson', 'Anthony Ralston', 'Scott McKenna'],
    mid: ['Scott McTominay', 'John McGinn', 'Tyler Fletcher', 'Ryan Christie', 'Lewis Ferguson', 'Kenny McLean'],
    fwd: ['Lyndon Dykes', 'Ché Adams', 'Ross Stewart', 'Ben Gannon-Doak', 'George Hirst', 'Lawrence Shankland', 'Findlay Curtis'],
  },
  sen: {
    gk: ['Yehvann Diouf', 'Édouard Mendy', 'Mory Diaw'],
    def: ['Mamadou Sarr', 'Kalidou Koulibaly', 'Abdoulaye Seck', 'Ismail Jakobs', 'Krépin Diatta', 'Moussa Niakhaté', 'Antoine Mendy', 'El Hadji Malick Diouf'],
    mid: ['Idrissa Gueye', 'Pathé Ciss', 'Lamine Camara', 'Pape Matar Sarr', 'Habib Diarra', 'Bara Sapoko Ndiaye', 'Pape Gueye'],
    fwd: ['Assane Diao', 'Bamba Dieng', 'Sadio Mané', 'Nicolas Jackson', 'Cherif Ndiaye', 'Iliman Ndiaye', 'Ismaïla Sarr', 'Ibrahim Mbaye'],
  },
  sui: {
    gk: ['Gregor Kobel', 'Yvon Mvogo', 'Marvin Keller'],
    def: ['Miro Muheim', 'Silvan Widmer', 'Nico Elvedi', 'Manuel Akanji', 'Ricardo Rodriguez', 'Eray Cömert', 'Aurèle Amenda', 'Luca Jaquez'],
    mid: ['Denis Zakaria', 'Remo Freuler', 'Johan Manzambi', 'Granit Xhaka', 'Ardon Jashari', 'Djibril Sow', 'Michel Aebischer', 'Fabian Rieder'],
    fwd: ['Breel Embolo', 'Dan Ndoye', 'Christian Fassnacht', 'Rubén Vargas', 'Noah Okafor', 'Zeki Amdouni', 'Cedric Itten'],
  },
  swe: {
    gk: ['Jacob Widell Zetterström', 'Viktor Johansson', 'Kristoffer Nordfeldt'],
    def: ['Gustaf Lagerbielke', 'Victor Lindelöf', 'Isak Hien', 'Gabriel Gudmundsson', 'Herman Johansson', 'Daniel Svensson', 'Hjalmar Ekdal', 'Carl Starfelt', 'Eric Smith', 'Alexander Bernhardsson', 'Elliot Stroud'],
    mid: ['Lucas Bergvall', 'Benjamin Nygren', 'Ken Sema', 'Jesper Karlström', 'Yasin Ayari', 'Mattias Svanberg', 'Besfort Zeneli'],
    fwd: ['Alexander Isak', 'Anthony Elanga', 'Viktor Gyökeres', 'Gustaf Nilsson', 'Taha Ali'],
  },
  tun: {
    gk: ['Mouhib Chamakh', 'Aymen Dahmen', 'Sabri Ben Hessen'],
    def: ['Ali Abdi', 'Montassar Talbi', 'Omar Rekik', 'Adem Arous', 'Dylan Bronn', 'Mortadha Ben Ouanes', 'Yan Valery', 'Mohamed Amine Ben Hamida', 'Moutaz Neffati', 'Raed Chikhaoui'],
    mid: ['Hannibal Mejbri', 'Ismaël Gharbi', 'Rani Khedira', 'Khalil Ayari', 'Hadj Mahmoud', 'Ellyes Skhiri', 'Anis Ben Slimane', 'Sebastian Tounekti'],
    fwd: ['Elias Achouri', 'Elias Saad', 'Hazem Mastouri', 'Rayan Elloumi', 'Firas Chaouat'],
  },
  tur: {
    gk: ['Mert Günok', 'Altay Bayındır', 'Uğurcan Çakır'],
    def: ['Zeki Çelik', 'Merih Demiral', 'Çağlar Söyüncü', 'Eren Elmalı', 'Abdülkerim Bardakcı', 'Ozan Kabak', 'Mert Müldür', 'Ferdi Kadıoğlu', 'Samet Akaydin'],
    mid: ['Salih Özcan', 'Orkun Kökçü', 'Hakan Çalhanoğlu', 'İsmail Yüksek', 'Kaan Ayhan'],
    fwd: ['Kerem Aktürkoğlu', 'Arda Güler', 'Deniz Gül', 'Kenan Yıldız', 'İrfan Can Kahveci', 'Yunus Akgün', 'Barış Alper Yılmaz', 'Oğuz Aydın', 'Can Uzun'],
  },
  uru: {
    gk: ['Sergio Rochet', 'Santiago Mele', 'Fernando Muslera'],
    def: ['José María Giménez', 'Sebastián Cáceres', 'Ronald Araújo', 'Guillermo Varela', 'Mathías Olivera', 'Matías Viña', 'Santiago Bueno'],
    mid: ['Manuel Ugarte', 'Rodrigo Bentancur', 'Nicolás de la Cruz', 'Federico Valverde', 'Giorgian de Arrascaeta', 'Agustín Canobbio', 'Emiliano Martínez', 'Maximiliano Araújo', 'Joaquín Piquerez', 'Juan Manuel Sanabria', 'Rodrigo Zalazar'],
    fwd: ['Darwin Núñez', 'Facundo Pellistri', 'Brian Rodríguez', 'Rodrigo Aguirre', 'Federico Viñas'],
  },
  usa: {
    gk: ['Matt Turner', 'Matt Freese', 'Chris Brady'],
    def: ['Sergiño Dest', 'Chris Richards', 'Antonee Robinson', 'Auston Trusty', 'Miles Robinson', 'Tim Ream', 'Alex Freeman', 'Maximilian Arfsten', 'Mark McKenzie', 'Joe Scally'],
    mid: ['Tyler Adams', 'Giovanni Reyna', 'Weston McKennie', 'Sebastian Berhalter', 'Cristian Roldan', 'Malik Tillman'],
    fwd: ['Ricardo Pepi', 'Christian Pulisic', 'Brenden Aaronson', 'Haji Wright', 'Folarin Balogun', 'Timothy Weah', 'Alejandro Zendejas'],
  },
  uzb: {
    gk: ['Utkir Yusupov', 'Abduvohid Nematov', 'Botirali Ergashev'],
    def: ['Abdukodir Khusanov', 'Khojiakbar Alijonov', 'Farrukh Sayfiev', 'Rustam Ashurmatov', 'Sherzod Nasrullaev', 'Umar Eshmurodov', 'Abdulla Abdullaev', 'Bekhruz Karimov', 'Avazbek Ulmasaliev', 'Jakhongir Urozov'],
    mid: ['Akmal Mozgovoy', 'Otabek Shukurov', 'Jamshid Iskanderov', 'Odiljon Hamrobekov', 'Jaloliddin Masharipov', 'Oston Urunov', 'Dostonbek Khamdamov', 'Azizjon Ganiev', 'Abbosbek Fayzullaev', 'Sherzod Esanov'],
    fwd: ['Eldor Shomurodov', 'Azizbek Amonov', 'Igor Sergeev'],
  },
};
