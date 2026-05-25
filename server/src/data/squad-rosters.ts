export interface RosterLine {
  gk: string[];
  def: string[];
  mid: string[];
  fwd: string[];
}

/** Заявки ЧМ-2026 по данным FIFA / olympics.com (предварительные и финальные) */
export const TEAM_ROSTERS: Record<string, RosterLine> = {
  mex: {
    gk: ['Alex Padilla', 'Antonio Rodríguez', 'Carlos Acevedo', 'Guillermo Ochoa', 'Raúl Rangel'],
    def: ['César Montes', 'Edson Álvarez', 'Johan Vásquez', 'Julián Araujo', 'Mateo Chávez', 'Ramón Juárez', 'Jesús Gallardo', 'Israel Reyes'],
    mid: ['Carlos Rodríguez', 'Erick Sánchez', 'Luis Chávez', 'Orbelin Pineda', 'Érick Gutiérrez', 'Marcel Ruiz', 'Luis Romo'],
    fwd: ['Raúl Jiménez', 'Santiago Giménez', 'César Huerta', 'Alexis Vega', 'Germán Berterame', 'Julián Quiñones'],
  },
  kor: {
    gk: ['Jo Hyeon-woo', 'Kim Seung-gyu', 'Song Bum-keun'],
    def: ['Kim Min-jae', 'Kim Moon-hwan', 'Lee Han-beom', 'Seol Young-woo', 'Park Jin-seob', 'Kim Tae-hyeon', 'Jens Castrop'],
    mid: ['Lee Kang-in', 'Paik Seung-ho', 'Hwang In-beom', 'Lee Jae-sung', 'Bae Jun-ho', 'Hwang Hee-chan', 'Yang Hyun-jun'],
    fwd: ['Son Heung-min', 'Oh Hyeon-gyu', 'Cho Gue-sung', 'Eom Ji-sung'],
  },
  cze: {
    gk: ['Matěj Kovář', 'Jindřich Staněk', 'Antonín Kinský'],
    def: ['Vladimír Coufal', 'Robin Hranáč', 'David Zima', 'Ladislav Krejčí', 'Tomáš Holeš', 'Adam Ševínský', 'Martin Vitík'],
    mid: ['Tomáš Souček', 'Lukáš Provod', 'Michal Sadílek', 'Pavel Šulc', 'Adam Karabec', 'Lukáš Červ'],
    fwd: ['Patrik Schick', 'Adam Hložek', 'Jan Kuchta', 'Václav Sejk', 'Tomáš Chorý'],
  },
  can: {
    gk: ['Milan Borjan', 'Maxime Crépeau', 'Dayne St. Clair'],
    def: ['Alphonso Davies', 'Sam Adekugbe', 'Derek Cornelius', 'Richie Laryea', 'Kamal Miller', 'Joël Waterman'],
    mid: ['Stephen Eustáquio', 'Samuel Piette', 'Ismaël Koné', 'Jonathan Osorio', 'Tajon Buchanan'],
    fwd: ['Jonathan David', 'Liam Millar', 'Jacob Shaffelburg', 'Lucas Cavallini'],
  },
  bih: {
    gk: ['Nikola Vasilj', 'Martin Zlomislić', 'Osman Hadžikić'],
    def: ['Sead Kolašinac', 'Amar Dedić', 'Tarik Muharemović', 'Dennis Hadžikadunić', 'Nidal Čelik'],
    mid: ['Amir Hadžiahmetović', 'Ivan Šunjić', 'Benjamin Tahirović', 'Amar Memić', 'Ivan Bašić'],
    fwd: ['Edin Džeko', 'Ermedin Demirović', 'Esmir Bajraktarević', 'Haris Tabaković', 'Kerim Alajbegović'],
  },
  qat: {
    gk: ['Meshaal Barsham', 'Salah Zakaria', 'Mahmoud Abunada'],
    def: ['Boualem Khoukhi', 'Tarek Salman', 'Bassam Al-Rawi', 'Lucas Mendes', 'Pedro Miguel'],
    mid: ['Karim Boudiaf', 'Assim Madibo', 'Abdulaziz Hatem', 'Ahmed Fathi', 'Homam Al-Amin'],
    fwd: ['Akram Afif', 'Almoez Ali', 'Hassan Al-Haydos', 'Yusuf Abdurisag', 'Edmílson Junior'],
  },
  bra: {
    gk: ['Alisson', 'Ederson', 'Weverton'],
    def: ['Marquinhos', 'Gabriel Magalhães', 'Bremer', 'Danilo', 'Wesley', 'Alex Sandro', 'Léo Pereira'],
    mid: ['Bruno Guimarães', 'Casemiro', 'Lucas Paquetá', 'Fabinho', 'Danilo Santos'],
    fwd: ['Vinícius Júnior', 'Neymar', 'Raphinha', 'Matheus Cunha', 'Gabriel Martinelli', 'Endrick', 'Igor Thiago'],
  },
  hai: {
    gk: ['Johnny Placide', 'Alexandre Pierre', 'Josué Duverger'],
    def: ['Carlens Arcus', 'Jean-Kevin Duverne', 'Hannes Delcroix', 'Ricardo Adé', 'Wilguens Paugain'],
    mid: ['Jeanricner Bellegarde', 'Carl-Fred Sainthe', 'Leverton Pierre', 'Jean-Jacques Danley'],
    fwd: ['Frantzdy Pierrot', 'Derrick Etienne', 'Wilson Isidor', 'Ruben Providence', 'Josué Casimir'],
  },
  sco: {
    gk: ['Angus Gunn', 'Craig Gordon', 'Liam Kelly'],
    def: ['Andy Robertson', 'Kieran Tierney', 'Scott McKenna', 'Grant Hanley', 'Aaron Hickey', 'Anthony Ralston', 'Jack Hendry'],
    mid: ['Scott McTominay', 'John McGinn', 'Billy Gilmour', 'Ryan Christie', 'Lewis Ferguson', 'Kenny McLean'],
    fwd: ['Lyndon Dykes', 'Che Adams', 'Lawrence Shankland', 'Ross Stewart', 'George Hirst'],
  },
  usa: {
    gk: ['Matt Turner', 'Ethan Horvath', 'Zack Steffen'],
    def: ['Antonee Robinson', 'Chris Richards', 'Tim Ream', 'Sergiño Dest', 'Walker Zimmerman', 'Miles Robinson'],
    mid: ['Christian Pulisic', 'Weston McKennie', 'Tyler Adams', 'Yunus Musah', 'Gio Reyna', 'Johnny Cardoso'],
    fwd: ['Ricardo Pepi', 'Folarin Balogun', 'Brandon Vazquez', 'Haji Wright'],
  },
  tur: {
    gk: ['Uğurcan Çakır', 'Altay Bayındır', 'Mert Günok'],
    def: ['Merih Demiral', 'Ferdi Kadıoğlu', 'Çağlar Söyüncü', 'Zeki Çelik', 'Abdülkerim Bardakcı', 'Mert Müldür'],
    mid: ['Hakan Çalhanoğlu', 'Arda Güler', 'Orkun Kökçü', 'Salih Özcan', 'İsmail Yüksek', 'Kenan Yıldız'],
    fwd: ['Kerem Aktürkoğlu', 'Barış Alper Yılmaz', 'Yunus Akgün', 'Can Uzun', 'Arda Güler'],
  },
  ger: {
    gk: ['Manuel Neuer', 'Marc-André ter Stegen', 'Oliver Baumann'],
    def: ['Antonio Rüdiger', 'Jonathan Tah', 'David Raum', 'Maximilian Mittelstädt', 'Benjamin Henrichs', 'Waldemar Anton'],
    mid: ['Jamal Musiala', 'Florian Wirtz', 'Joshua Kimmich', 'Pascal Groß', 'Felix Nmecha', 'Robert Andrich'],
    fwd: ['Kai Havertz', 'Niclas Füllkrug', 'Leroy Sané', 'Deniz Undav', 'Tim Kleindienst'],
  },
  cuw: {
    gk: ['Eloy Room', 'Tyrick Bodak', 'Trevor Doornbusch'],
    def: ['Riechedly Bazoer', 'Sherel Floranus', 'Juriën Gaari', 'Armando Obispo', 'Joshua Brenet'],
    mid: ['Leandro Bacuna', 'Juninho Bacuna', 'Tyrese Noslin', 'Godfried Roemeratoe', 'Kevin Felida'],
    fwd: ['Leandro Bacuna', 'Jearl Margaritha', 'Jürgen Locadia', 'Tahith Chong', 'Sontje Hansen'],
  },
  civ: {
    gk: ['Yahia Fofana', 'Alban Lafont', 'Mohamed Koné'],
    def: ['Ousmane Diomandé', 'Evan Ndicka', 'Wilfried Singo', 'Odilon Kossounou', 'Emmanuel Agbadou', 'Ghislain Konan'],
    mid: ['Franck Kessié', 'Ibrahim Sangaré', 'Seko Fofana', 'Jean-Mickaël Seri', 'Parfait Guiagon'],
    fwd: ['Nicolas Pépé', 'Amad Diallo', 'Simon Adingra', 'Oumar Diakité', 'Sébastien Haller'],
  },
  jpn: {
    gk: ['Suzuki Zion', 'Hayakawa Tomoki', 'Osako Keisuke'],
    def: ['Tomiyasu Takehiro', 'Itakura Ko', 'Hiroki Ito', 'Sugawara Yukinari', 'Shogo Taniguchi', 'Seko Ayumu'],
    mid: ['Endo Wataru', 'Kamada Daichi', 'Tanaka Ao', 'Doan Ritsu', 'Kubo Takefusa', 'Nakamura Keito', 'Maeda Daizen'],
    fwd: ['Minamino Takumi', 'Ueda Ayase', 'Ito Junya', 'Soma Yuki', 'Ogawa Koki'],
  },
  swe: {
    gk: ['Viktor Johansson', 'Kristoffer Nordfeldt', 'Jacob Widell Zetterström'],
    def: ['Victor Lindelöf', 'Isak Hien', 'Gabriel Gudmundsson', 'Emil Holm', 'Carl Starfelt', 'Hjalmar Ekdal'],
    mid: ['Lucas Bergvall', 'Mattias Svanberg', 'Yasin Ayari', 'Jesper Karlström', 'Besfort Zeneli'],
    fwd: ['Alexander Isak', 'Viktor Gyökeres', 'Anthony Elanga', 'Benjamin Nygren', 'Gustaf Nilsson'],
  },
  tun: {
    gk: ['Aymen Dahman', 'Sabri Ben Hessen', 'Abdelmouhib Chamakh'],
    def: ['Montassar Talbi', 'Dylan Bronn', 'Ali Abdi', 'Omar Rekik', 'Yan Valery', 'Mohamed Amine Ben Hamida'],
    mid: ['Ellyes Skhiri', 'Aïssa Mandi', 'Hannibal Mejbri', 'Anis Ben Slimane', 'Rani Khedira', 'Ismael Gharbi'],
    fwd: ['Elias Saad', 'Khalil Ayari', 'Sebastian Tounekti', 'Elias Achouri', 'Firás Chaouat'],
  },
  bel: {
    gk: ['Thibaut Courtois', 'Senne Lammens', 'Mike Penders'],
    def: ['Arthur Theate', 'Zeno Debast', 'Timothy Castagne', 'Thomas Meunier', 'Koni De Winter', 'Maxim De Cuyper'],
    mid: ['Kevin De Bruyne', 'Youri Tielemans', 'Amadou Onana', 'Axel Witsel', 'Hans Vanaken', 'Nicolas Raskin'],
    fwd: ['Romelu Lukaku', 'Jeremy Doku', 'Leandro Trossard', 'Charles De Ketelaere', 'Dodi Lukebakio', 'Alexis Saelemaekers'],
  },
  irn: {
    gk: ['Alireza Beiranvand', 'Payam Niazmand', 'Seyed Hossein Hosseini'],
    def: ['Milad Mohammadi', 'Hossein Kanaani', 'Shoja Khalilzadeh', 'Ramin Rezaeian', 'Ehsan Hajsafi', 'Saleh Hardani'],
    mid: ['Saeid Ezatolahi', 'Alireza Jahanbakhsh', 'Mehdi Torabi', 'Saman Ghoddos', 'Mohammad Mohebi', 'Rouzbeh Cheshmi'],
    fwd: ['Mehdi Taremi', 'Sardar Azmoun', 'Ali Alipour', 'Amirhossein Hosseinzadeh'],
  },
  nzl: {
    gk: ['Max Crocombe', 'Alex Paulsen', 'Michael Woud'],
    def: ['Liberato Cacace', 'Michael Boxall', 'Tyler Bindon', 'Tim Payne', 'Finn Surman', 'Francis De Vries'],
    mid: ['Joe Bell', 'Marko Stamenić', 'Alex Rufer', 'Ryan Thomas', 'Lachlan Bayliss'],
    fwd: ['Chris Wood', 'Ben Waine', 'Ben Old', 'Matt Garbett', 'Kosta Barbarouses'],
  },
  cpv: {
    gk: ['Vozinha', 'Carlos Santos', 'Márcio da Rosa'],
    def: ['Stopira', 'Logan Costa', 'Steven Moreira', 'Wagner Pina', 'Sidny Lopes Cabral', 'Kelvin Pires'],
    mid: ['Jamiro Monteiro', 'Telmo Arcanjo', 'Deroy Duarte', 'Kevin Pina', 'Laros Duarte'],
    fwd: ['Jovane Cabral', 'Ryan Mendes', 'Garry Rodrigues', 'Dailon Livramento', 'Ryan Mendes'],
  },
  fra: {
    gk: ['Mike Maignan', 'Brice Samba', 'Robin Risser'],
    def: ['William Saliba', 'Jules Koundé', 'Dayot Upamecano', 'Theo Hernandez', 'Lucas Hernandez', 'Ibrahima Konaté', 'Malo Gusto'],
    mid: ['Aurélien Tchouaméni', 'Adrien Rabiot', "N'Golo Kanté", 'Warren Zaïre-Emery', 'Manu Koné'],
    fwd: ['Kylian Mbappé', 'Ousmane Dembélé', 'Michael Olise', 'Marcus Thuram', 'Bradley Barcola', 'Désiré Doué', 'Rayan Cherki'],
  },
  arg: {
    gk: ['Emiliano Martínez', 'Gerónimo Rulli', 'Juan Musso'],
    def: ['Cristian Romero', 'Lisandro Martínez', 'Nahuel Molina', 'Marcos Acuña', 'Nicolás Tagliafico', 'Germán Pezzella', 'Marcos Senesi'],
    mid: ['Alexis Mac Allister', 'Enzo Fernández', 'Rodrigo De Paul', 'Leandro Paredes', 'Exequiel Palacios', 'Giovani Lo Celso', 'Nicolás Domínguez'],
    fwd: ['Lionel Messi', 'Lautaro Martínez', 'Julián Álvarez', 'Alejandro Garnacho', 'Ángel Correa', 'Paulo Dybala', 'Franco Mastantuono'],
  },
  aut: {
    gk: ['Patrick Pentz', 'Alexander Schlager', 'Florian Wiegele'],
    def: ['David Alaba', 'Kevin Danso', 'Stefan Posch', 'Philipp Lienhart', 'Marco Friedl', 'Alexander Prass'],
    mid: ['Marcel Sabitzer', 'Konrad Laimer', 'Florian Grillitsch', 'Christoph Baumgartner', 'Nicolas Seiwald', 'Romano Schmid'],
    fwd: ['Marko Arnautović', 'Michael Gregoritsch', 'Saša Kalajdzić', 'Patrick Wimmer'],
  },
  por: {
    gk: ['Diogo Costa', 'José Sá', 'Rui Silva'],
    def: ['Rúben Dias', 'Nuno Mendes', 'João Cancelo', 'Diogo Dalot', 'Nélson Semedo', 'Gonçalo Inácio'],
    mid: ['Bruno Fernandes', 'Bernardo Silva', 'Vitinha', 'João Neves', 'Rúben Neves', 'Otávio'],
    fwd: ['Cristiano Ronaldo', 'Rafael Leão', 'Gonçalo Ramos', 'Pedro Neto', 'Francisco Conceição', 'Diogo Jota'],
  },
  cod: {
    gk: ['Lionel Mpasi', 'Timothy Fayulu', 'Mike Epolo'],
    def: ['Chancel Mbemba', 'Aaron Wan-Bissaka', 'Arthur Masuaku', 'Axel Tuanzebe', 'Rocky Bushiri', 'Gédéon Kalulu'],
    mid: ['Edo Kayembe', 'Samuel Moutoussamy', 'Charles Pickel', 'Nathan Mukau', 'Théo Bongonda'],
    fwd: ['Yoane Wissa', 'Cédric Bakambu', 'Simon Banza', 'Fiston Mayele', 'Meschack Elia'],
  },
  col: {
    gk: ['Camilo Vargas', 'David Ospina', 'Kevin Mier'],
    def: ['Davinson Sánchez', 'Yerry Mina', 'Daniel Muñoz', 'Johan Mojica', 'Jhon Lucumí', 'Santiago Arias'],
    mid: ['James Rodríguez', 'Jefferson Lerma', 'Richard Ríos', 'Jhon Arias', 'Jorge Carrascal', 'Wilmar Barrios'],
    fwd: ['Luis Díaz', 'Rafael Santos Borré', 'Jhon Córdoba', 'Sebastian Villa', 'Juan Camilo Hernández'],
  },
  cro: {
    gk: ['Dominik Livaković', 'Dominik Kotarski', 'Ivor Pandur'],
    def: ['Joško Gvardiol', 'Duje Ćaleta-Car', 'Josip Šutalo', 'Josip Stanišić', 'Marin Pongračić', 'Luka Vušković'],
    mid: ['Luka Modrić', 'Mateo Kovačić', 'Mario Pašalić', 'Nikola Vlašić', 'Lovro Majer', 'Petar Sučić'],
    fwd: ['Andrej Kramarić', 'Ivan Perišić', 'Ante Budimir', 'Petar Musa', 'Marco Pašalić'],
  },
  // Команды с частичными данными — ключевые игроки
  rsa: {
    gk: ['Ronwen Williams', 'Veli Mothwa'],
    def: ['Grant Kekana', 'Teboho Mokoena', 'Khuliso Mudau', 'Nkosinathi Sibisi'],
    mid: ['Percy Tau', 'Themba Zwane', 'Sphephelo Sithole', 'Ethan Chislett'],
    fwd: ['Lyle Foster', 'Evidence Makgopa', 'Zakhele Lepasa'],
  },
  par: {
    gk: ['Anthony Silva', 'Juan Espínola'],
    def: ['Gustavo Gómez', 'Omar Alderete', 'Blas Riveros', 'Juan Fuentes'],
    mid: ['Miguel Almirón', 'Diego Gómez', 'Matías Rojas', 'Richard Sánchez'],
    fwd: ['Antonio Sanabria', 'Adam Bareiro', 'Julio Enciso'],
  },
  aus: {
    gk: ['Mathew Ryan', 'Joe Gauci'],
    def: ['Harry Souttar', 'Kye Rowles', 'Aziz Behich', 'Thomas Deng'],
    mid: ['Jackson Irvine', 'Riley McGree', 'Keanu Bacchus', 'Aiden O\'Neill'],
    fwd: ['Mitchell Duke', 'Kusini Yengi', 'Martin Boyle', 'Jamie Maclaren'],
  },
  ned: {
    gk: ['Bart Verbruggen', 'Mark Flekken'],
    def: ['Virgil van Dijk', 'Nathan Aké', 'Jeremie Frimpong', 'Micky van de Ven', 'Denzel Dumfries'],
    mid: ['Frenkie de Jong', 'Ryan Gravenberch', 'Tijjani Reijnders', 'Georginio Wurtz', 'Steven Bergwijn'],
    fwd: ['Cody Gakpo', 'Memphis Depay', 'Brian Brobbey', 'Donyell Malen'],
  },
  ecu: {
    gk: ['Hernán Galíndez', 'Alexander Domínguez'],
    def: ['Piero Hincapié', 'Felix Torres', 'Angelo Preciado', 'Robert Arboleda'],
    mid: ['Moisés Caicedo', 'Kendry Páez', 'Carlos Gruezo', 'Moisés Caicedo'],
    fwd: ['Enner Valencia', 'Willian Pacho', 'Jordy Caicedo'],
  },
  esp: {
    gk: ['Unai Simón', 'David Raya'],
    def: ['Aymeric Laporte', 'Robin Le Normand', 'Marc Cucurella', 'Daniel Carvajal', 'Pau Cubarsí'],
    mid: ['Pedri', 'Rodri', 'Fabián Ruiz', 'Mikel Merino', 'Dani Olmo'],
    fwd: ['Lamine Yamal', 'Álvaro Morata', 'Nico Williams', 'Gerard Moreno', 'Ferran Torres'],
  },
  mar: {
    gk: ['Yassine Bono', 'Munir El Kajoui'],
    def: ['Achraf Hakimi', 'Nayef Aguerd', 'Romain Saïss', 'Noussair Mazraoui'],
    mid: ['Sofyan Amrabat', 'Azzedine Ounahi', 'Brahim Díaz', 'Selim Amallah'],
    fwd: ['Youssef En-Nesyri', 'Oussama Ighal', 'Ez Abde', 'Amine Harit'],
  },
  ksa: {
    gk: ['Mohammed Al-Owais', 'Yassine Bono'],
    def: ['Ali Al-Bulayhi', 'Sultan Al-Ghannam', 'Mohammed Al-Breik', 'Yasser Al-Shahrani'],
    mid: ['Salem Al-Dawsari', 'Firas Al-Buraikan', 'Abdullah Al-Khaibari', 'Sami Al-Najei'],
    fwd: ['Saleh Al-Shehri', 'Firas Al-Buraikan', 'Abdullah Radif'],
  },
  uru: {
    gk: ['Sergio Rochet', 'Franco Israel'],
    def: ['Ronald Araújo', 'José Giménez', 'Matías Viña', 'Guillermo Varela'],
    mid: ['Federico Valverde', 'Rodrigo Bentancur', 'Manuel Ugarte', 'Facundo Pellistri'],
    fwd: ['Darwin Núñez', 'Luis Suárez', 'Facundo Torres', 'Maximiliano Araújo'],
  },
  sen: {
    gk: ['Édouard Mendy', 'Boris Diaw'],
    def: ['Kalidou Koulibaly', 'Abdou Diallo', 'Ismail Jakobs', 'Fodé Ballo-Touré'],
    mid: ['Idrissa Gueye', 'Pape Gueye', 'Cheikh Kouyaté', 'Nampalys Mendy'],
    fwd: ['Sadio Mané', 'Nicolas Jackson', 'Boulaye Dia', 'Habib Diallo'],
  },
  nor: {
    gk: ['Bernd Leno', 'Ørjan Nyland'],
    def: ['Stefan Bajcetic', 'Leo Østigård', 'Felix Myhre', 'Julian Ryerson'],
    mid: ['Martin Ødegaard', 'Sander Berge', 'Patrick Berg', 'Antonio Nusa'],
    fwd: ['Erling Haaland', 'Alexander Sørloth', 'Joshua King', 'Aron Dønnum'],
  },
  eng: {
    gk: ['Jordan Pickford', 'Dean Henderson', 'James Trafford'],
    def: [
      'John Stones', 'Marc Guéhi', 'Ezri Konsa', 'Dan Burn', 'Jarell Quansah',
      'Reece James', 'Tino Livramento', "Nico O'Reilly", 'Djed Spence',
    ],
    mid: [
      'Declan Rice', 'Jude Bellingham', 'Elliot Anderson', 'Kobbie Mainoo',
      'Morgan Rogers', 'Eberechi Eze', 'Jordan Henderson',
    ],
    fwd: [
      'Harry Kane', 'Bukayo Saka', 'Marcus Rashford', 'Anthony Gordon',
      'Noni Madueke', 'Ollie Watkins', 'Ivan Toney',
    ],
  },
  gha: {
    gk: ['Lawrence Ati-Zigi', 'Richard Ofori'],
    def: ['Daniel Amartey', 'Alexander Djiku', 'Mohammed Salisu', 'Gideon Mensah'],
    mid: ['Thomas Partey', 'Mohammed Kudus', 'André Ayew', 'Joseph Paintsil'],
    fwd: ['Mohammed Kudus', 'Jordan Ayew', 'Ernest Nuamah', 'Antoine Semenyo'],
  },
  pan: {
    gk: ['Orlando Mosquera', 'José Calderón'],
    def: ['Michael Murillo', 'Fidel Escobar', 'Harold Cummings', 'Roderick Miller'],
    mid: ['Aníbal Godoy', 'Adalberto Carrasquilla', 'José Fajardo', 'Alberto Quintero'],
    fwd: ['José Fajardo', 'Ismael Díaz', 'César Yanis', 'Roberto Nurse'],
  },
  uzb: {
    gk: ['Utkir Yusupov', 'Vladimir Nesterov'],
    def: ['Eldor Shomurodov', 'Abdulla Abdullayev', 'Khozhimat Erkinov', 'Sanzhar Tursunov'],
    mid: ['Jaloliddin Masharipov', 'Odil Ahmedov', 'Otabek Shukurov', 'Sherzod Nasriddinov'],
    fwd: ['Eldor Shomurodov', 'Abbosbek Fayzullaev', 'Khozhimat Erkinov'],
  },
  alg: {
    gk: ['Raïs M\'bolhi', 'Anthony Mandrea'],
    def: ['Ramy Bensebaini', 'Aissa Mandi', 'Youcef Atal', 'Amir Belkheir'],
    mid: ['Ismaël Bennacer', 'Riyad Mahrez', 'Ramiz Zerrouki', 'Youcef Belaïli'],
    fwd: ['Riyad Mahrez', 'Youcef Belaïli', 'Amine Gouiri', 'Said Benrahma'],
  },
  jor: {
    gk: ['Yazid Abulaila', 'Ahmad Al Juaidi'],
    def: ['Yazan Al Arab', 'Mohammad Abu Hashish', 'Abdallah Nasib', 'Saed Al Rosan'],
    mid: ['Mousa Al-Tamari', 'Ibrahim Sadeh', 'Rajaei Ayed', 'Noor Al Rawabdeh'],
    fwd: ['Mousa Al-Tamari', 'Ali Olwan', 'Yazan Al-Naimat', 'Odeh Fakhoury'],
  },
  sui: {
    gk: ['Yann Sommer', 'Gregor Kobel'],
    def: ['Manuel Akanji', 'Ricardo Rodríguez', 'Fabian Schär', 'Silvan Widmer'],
    mid: ['Granit Xhaka', 'Ruben Vargas', 'Denis Zakaria', 'Michel Rieder'],
    fwd: ['Breel Embolo', 'Dan Ndoye', 'Zeki Amdouni', 'Kwadwo Duah'],
  },
  egy: {
    gk: ['Mohamed El Shenawy', 'Mohamed Abougabal'],
    def: ['Mohamed Hany', 'Ahmed Hegazi', 'Mohamed Abdelmonem', 'Ahmed Fatouh'],
    mid: ['Mohamed Elneny', 'Emam Ashour', 'Mohamed Salah', 'Trézéguet'],
    fwd: ['Mohamed Salah', 'Omar Marmoush', 'Mostafa Mohamed', 'Ahmed Hassan'],
  },
  irq: {
    gk: ['Jalil Hassan', 'Ahmed Basim'],
    def: ['Ali Adnan', 'Saad Natiq', 'Manar Salih', 'Hussein Ali'],
    mid: ['Zidane Iqbal', 'Amir Al-Ammari', 'Aymen Hussein', 'Bashar Resan'],
    fwd: ['Aymen Hussein', 'Mohammed Ali Ahmed', 'Osama Rashid'],
  },
};
