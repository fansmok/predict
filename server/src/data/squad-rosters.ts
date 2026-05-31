export interface RosterLine {
  gk: string[];
  def: string[];
  mid: string[];
  fwd: string[];
}

/**
 * Заявки ЧМ-2026: FIFA + worldcupstats.football (май 2026).
 * Финальные 26: https://worldcupstats.football/ru/squads/
 * Provisional — расширенные списки до регистрации FIFA (2 июня).
 */
export const TEAM_ROSTERS: Record<string, RosterLine> = {
  // ─── Финальные составы (26) — worldcupstats.football, 29 сборных ───────────

  aut: {
    gk: ['Patrick Pentz', 'Alexander Schlager', 'Florian Wiegele'],
    def: ['David Affengruber', 'David Alaba', 'Kevin Danso', 'Marco Friedl', 'Philipp Lienhart', 'Phillipp Mwene', 'Stefan Posch', 'Alexander Prass', 'Michael Svoboda'],
    mid: ['Christoph Baumgartner', 'Carney Chukwuemeka', 'Florian Grillitsch', 'Konrad Laimer', 'Marcel Sabitzer', 'Xaver Schlager', 'Nicolas Seiwald', 'Romano Schmid', 'Alessandro Schöpf', 'Paul Wanner', 'Patrick Wimmer'],
    fwd: ['Marko Arnautović', 'Michael Gregoritsch', 'Saša Kalajdzić'],
  },
  bel: {
    gk: ['Thibaut Courtois', 'Senne Lammens', 'Mike Penders'],
    def: ['Timothy Castagne', 'Zeno Debast', 'Maxim De Cuyper', 'Koni De Winter', 'Brandon Mechele', 'Thomas Meunier', 'Nathan Ngoy', 'Joaquin Seys', 'Arthur Theate'],
    mid: ['Kevin De Bruyne', 'Amadou Onana', 'Nicolas Raskin', 'Youri Tielemans', 'Hans Vanaken', 'Axel Witsel'],
    fwd: ['Charles De Ketelaere', 'Jeremy Doku', 'Matias Fernandez Pardo', 'Romelu Lukaku', 'Dodi Lukebakio', 'Diego Moreira', 'Alexis Saelemaekers', 'Leandro Trossard'],
  },
  bih: {
    gk: ['Nikola Vasilj', 'Martin Zlomislić', 'Osman Hadžikić'],
    def: ['Sead Kolašinac', 'Amar Dedić', 'Nihad Mujakić', 'Nikola Katić', 'Tarik Muharemović', 'Stjepan Radeljić', 'Dennis Hadžikadunić', 'Nidal Čelik'],
    mid: ['Amir Hadžiahmetović', 'Ivan Šunjić', 'Ivan Bašić', 'Dženis Burnić', 'Ermin Mahmić', 'Benjamin Tahirović', 'Amar Memić', 'Armin Gigović', 'Kerim Alajbegović', 'Esmir Bajraktarević'],
    fwd: ['Ermedin Demirović', 'Jovo Lukić', 'Samed Baždar', 'Haris Tabaković', 'Edin Džeko'],
  },
  bra: {
    gk: ['Alisson', 'Ederson', 'Weverton'],
    def: ['Wesley', 'Gabriel Magalhães', 'Marquinhos', 'Alex Sandro', 'Danilo', 'Bremer', 'Roger Ibañez', 'Léo Pereira', 'Douglas Santos'],
    mid: ['Bruno Guimarães', 'Casemiro', 'Danilo Santos', 'Fabinho', 'Lucas Paquetá'],
    fwd: ['Vinícius Júnior', 'Matheus Cunha', 'Neymar', 'Raphinha', 'Endrick', 'Luiz Henrique', 'Gabriel Martinelli', 'Igor Thiago', 'Rayan'],
  },
  cpv: {
    gk: ['Vozinha', 'Márcio Rosa', 'CJ dos Santos'],
    def: ['Stopira', 'Roberto Lopes', 'João Paulo', 'Diney', 'Logan Costa', 'Steven Moreira', 'Wagner Pina', 'Sidny Lopes Cabral', 'Kelvin Pires'],
    mid: ['Jamiro Monteiro', 'Kevin Pina', 'Deroy Duarte', 'Telmo Arcanjo', 'Laros Duarte', 'Yannick Semedo'],
    fwd: ['Ryan Mendes', 'Garry Rodrigues', 'Willy Semedo', 'Jovane Cabral', 'Gilson Benchimol', 'Dailon Livramento', 'Hélio Varela', 'Nuno da Costa'],
  },
  cod: {
    gk: ['Lionel Mpasi', 'Timothy Fayulu', 'Matthieu Epolo'],
    def: ['Chancel Mbemba', 'Arthur Masuaku', 'Gédéon Kalulu', 'Joris Kayembe', 'Dylan Batubinsika', 'Axel Tuanzebe', 'Aaron Wan-Bissaka', 'Steve Kapuadi'],
    mid: ['Samuel Moutoussamy', 'Edo Kayembe', 'Charles Pickel', 'Gaël Kakuta', 'Noah Sadiki', 'Aaron Tshibola', 'Ngal\'ayel Mukau', 'Brian Cipenga', 'Théo Bongonda'],
    fwd: ['Cédric Bakambu', 'Meschak Elia', 'Fiston Mayele', 'Yoane Wissa', 'Nathanaël Mbuku', 'Simon Banza'],
  },
  civ: {
    gk: ['Yahia Fofana', 'Alban Lafont', 'Mohamed Koné'],
    def: ['Ghislain Konan', 'Odilon Kossounou', 'Wilfried Singo', 'Evan Ndicka', 'Emmanuel Agbadou', 'Guéla Doué', 'Ousmane Diomandé', 'Christopher Opéri'],
    mid: ['Franck Kessié', 'Jean-Mickaël Seri', 'Ibrahim Sangaré', 'Seko Fofana', 'Christ Inao Oulaï', 'Parfait Guiagon'],
    fwd: ['Nicolas Pépé', 'Oumar Diakité', 'Simon Adingra', 'Evann Guessand', 'Amad Diallo', 'Yan Diomandé', 'Bazoumana Touré', 'Elye Wahi', 'Ange-Yoan Bonny'],
  },
  cro: {
    gk: ['Dominik Livaković', 'Dominik Kotarski', 'Ivor Pandur'],
    def: ['Joško Gvardiol', 'Duje Ćaleta-Car', 'Josip Šutalo', 'Josip Stanišić', 'Marin Pongračić', 'Martin Erlić', 'Luka Vušković'],
    mid: ['Luka Modrić', 'Mateo Kovačić', 'Mario Pašalić', 'Nikola Vlašić', 'Luka Sučić', 'Martin Baturina', 'Kristijan Jakić', 'Petar Sučić', 'Nikola Moro', 'Toni Fruk'],
    fwd: ['Ivan Perišić', 'Andrej Kramarić', 'Ante Budimir', 'Marco Pašalić', 'Petar Musa', 'Igor Matanović'],
  },
  cuw: {
    gk: ['Eloy Room', 'Tyrick Bodak', 'Trevor Doornbusch'],
    def: ['Riechedly Bazoer', 'Joshua Brenet', 'Roshon van Eijma', 'Sherel Floranus', 'Deveron Fonville', 'Juriën Gaari', 'Armando Obispo', 'Shurandy Sambo'],
    mid: ['Juninho Bacuna', 'Leandro Bacuna', 'Livano Comenencia', 'Kevin Felida', 'Ar\'jany Martha', 'Tyrese Noslin', 'Godfried Roemeratoe'],
    fwd: ['Jeremy Antonisse', 'Tahith Chong', 'Kenji Gorré', 'Sontje Hansen', 'Gervane Kastaneer', 'Brandley Kuwas', 'Jürgen Locadia', 'Jearl Margaritha'],
  },
  can: {
    gk: ['Maxime Crépeau', 'Dayne St. Clair', 'Owen Goodman'],
    def: ['Alphonso Davies', 'Alistair Johnston', 'Moïse Bombito', 'Derek Cornelius', 'Alfie Jones', 'Richie Laryea', 'Joel Waterman', 'Luc de Fougerolles', 'Niko Sigur'],
    mid: ['Stephen Eustáquio', 'Ismaël Koné', 'Jonathan Osorio', 'Tajon Buchanan', 'Ali Ahmed', 'Liam Millar', 'Mathieu Choinière', 'Marcelo Flores', 'Nathan Saliba', 'Jacob Shaffelburg'],
    fwd: ['Jonathan David', 'Cyle Larin', 'Tani Oluwaseyi', 'Promise David'],
  },
  col: {
    gk: ['Camilo Vargas', 'David Ospina', 'Álvaro Montero'],
    def: ['Daniel Muñoz', 'Santiago Arias', 'Yerry Mina', 'Davinson Sánchez', 'Jhon Lucumí', 'Willer Ditta', 'Yohan Mojica', 'Déiver Machado'],
    mid: ['James Rodríguez', 'Jefferson Lerma', 'Richard Ríos', 'Kevin Castaño', 'Juan Fernando Quintero', 'Jorge Carrascal', 'Gustavo Puerta', 'Juan Camilo Portilla', 'Jhon Arias'],
    fwd: ['Luis Díaz', 'Luis Suárez', 'Juan Camilo Hernández', 'Jhon Córdoba', 'Carlos Andrés Gómez', 'Jaminton Campaz'],
  },
  eng: {
    gk: ['Jordan Pickford', 'Dean Henderson', 'James Trafford'],
    def: ['John Stones', 'Marc Guéhi', 'Ezri Konsa', 'Dan Burn', 'Jarell Quansah', 'Reece James', 'Tino Livramento', "Nico O'Reilly", 'Djed Spence'],
    mid: ['Declan Rice', 'Jude Bellingham', 'Elliot Anderson', 'Kobbie Mainoo', 'Morgan Rogers', 'Eberechi Eze', 'Jordan Henderson'],
    fwd: ['Harry Kane', 'Bukayo Saka', 'Marcus Rashford', 'Anthony Gordon', 'Noni Madueke', 'Ollie Watkins', 'Ivan Toney'],
  },
  esp: {
    gk: ['Unai Simón', 'David Raya', 'Joan García'],
    def: ['Marcos Llorente', 'Pedro Porro', 'Eric García', 'Marc Pubill', 'Aymeric Laporte', 'Pau Cubarsí', 'Marc Cucurella', 'Alejandro Grimaldo'],
    mid: ['Rodri', 'Pedri', 'Fabián Ruiz', 'Martín Zubimendi', 'Gavi', 'Mikel Merino', 'Álex Baena'],
    fwd: ['Lamine Yamal', 'Nico Williams', 'Mikel Oyarzabal', 'Dani Olmo', 'Ferran Torres', 'Yeremy Pino', 'Borja Iglesias', 'Víctor Muñoz'],
  },
  fra: {
    gk: ['Mike Maignan', 'Brice Samba', 'Robin Risser'],
    def: ['Lucas Digne', 'Malo Gusto', 'Lucas Hernandez', 'Theo Hernandez', 'Ibrahima Konaté', 'Maxence Lacroix', 'Jules Koundé', 'William Saliba', 'Dayot Upamecano'],
    mid: ['N\'Golo Kanté', 'Manu Koné', 'Adrien Rabiot', 'Aurélien Tchouaméni', 'Warren Zaïre-Emery'],
    fwd: ['Maghnes Akliouche', 'Bradley Barcola', 'Rayan Cherki', 'Ousmane Dembélé', 'Désiré Doué', 'Michael Olise', 'Kylian Mbappé', 'Jean-Philippe Mateta', 'Marcus Thuram'],
  },
  ger: {
    gk: ['Manuel Neuer', 'Oliver Baumann', 'Alexander Nübel'],
    def: ['Antonio Rüdiger', 'Waldemar Anton', 'Jonathan Tah', 'Nico Schlotterbeck', 'David Raum', 'Nathaniel Brown', 'Malick Thiaw'],
    mid: ['Joshua Kimmich', 'Aleksandar Pavlović', 'Leon Goretzka', 'Jamie Leweling', 'Jamal Musiala', 'Pascal Groß', 'Angelo Stiller', 'Florian Wirtz', 'Leroy Sané', 'Nadiem Amiri', 'Felix Nmecha', 'Lennart Karl'],
    fwd: ['Kai Havertz', 'Nick Woltemade', 'Maximilian Beier', 'Deniz Undav'],
  },
  hai: {
    gk: ['Johny Placide', 'Alexandre Pierre', 'Josué Duverger'],
    def: ['Ricardo Adé', 'Carlens Arcus', 'Martin Expérience', 'Jean-Kévin Duverne', 'Duke Lacroix', 'Wilguens Paugain', 'Hannes Delcroix', 'Keeto Thermoncy'],
    mid: ['Leverton Pierre', 'Danley Jean Jacques', 'Carl Sainté', 'Jean-Ricner Bellegarde', 'Woodensky Pierre', 'Dominique Simon'],
    fwd: ['Duckens Nazon', 'Frantzdy Pierrot', 'Derrick Etienne Jr.', 'Louicius Deedson', 'Ruben Providence', 'Josué Casimir', 'Yassin Fortuné', 'Wilson Isidor', 'Lenny Joseph'],
  },
  jpn: {
    gk: ['Zion Suzuki', 'Keisuke Osako', 'Tomoki Hayakawa'],
    def: ['Yuto Nagatomo', 'Shogo Taniguchi', 'Takehiro Tomiyasu', 'Ko Itakura', 'Tsuyoshi Watanabe', 'Hiroki Ito', 'Ayumu Seko', 'Junnosuke Suzuki', 'Yukinari Sugawara'],
    mid: ['Wataru Endo', 'Ao Tanaka', 'Takefusa Kubo', 'Ritsu Doan', 'Keito Nakamura', 'Junya Ito', 'Daichi Kamada', 'Kaishu Sano'],
    fwd: ['Keisuke Goto', 'Daizen Maeda', 'Yuito Suzuki', 'Ayase Ueda', 'Koki Ogawa', 'Kento Shiogai'],
  },
  kor: {
    gk: ['Kim Seung-gyu', 'Jo Hyeon-woo', 'Song Bum-keun'],
    def: ['Kim Min-jae', 'Kim Moon-hwan', 'Seol Young-woo', 'Cho Yu-min', 'Lee Tae-seok', 'Park Jin-seob', 'Kim Tae-hyeon', 'Lee Han-beom', 'Jens Castrop', 'Lee Ki-hyuk'],
    mid: ['Lee Jae-sung', 'Hwang Hee-chan', 'Hwang In-beom', 'Lee Kang-in', 'Paik Seung-ho', 'Kim Jin-gyu', 'Lee Dong-gyeong', 'Bae Jun-ho', 'Eom Ji-sung', 'Yang Hyun-jun'],
    fwd: ['Son Heung-min', 'Cho Gue-sung', 'Oh Hyeon-gyu'],
  },
  mar: {
    gk: ['Yassine Bounou', 'Munir Mohamedi', 'Ahmed Tagnaouti'],
    def: ['Achraf Hakimi', 'Noussair Mazraoui', 'Nayef Aguerd', 'Chadi Riad', 'Issa Diop', 'Anass Salah-Eddine', 'Youssef Belammari', 'Redouane Halhal', 'Zakaria El Ouahdi'],
    mid: ['Sofyan Amrabat', 'Azzedine Ounahi', 'Bilal El Khannouss', 'Ismael Saibari', 'Neil El Aynaoui', 'Ayyoub Bouaddi', 'Samir El Mourabet'],
    fwd: ['Brahim Díaz', 'Ayoub El Kaabi', 'Soufiane Rahimi', 'Abdessamad Ezzalzouli', 'Chemsdine Talbi', 'Yassine Gessime', 'Ayoub Amaimouni-Echghouyabe'],
  },
  ned: {
    gk: ['Bart Verbruggen', 'Mark Flekken', 'Robin Roefs'],
    def: ['Virgil van Dijk', 'Denzel Dumfries', 'Nathan Aké', 'Jurriën Timber', 'Micky van de Ven', 'Jorrel Hato', 'Jan Paul van Hecke', 'Mats Wieffer'],
    mid: ['Frenkie de Jong', 'Ryan Gravenberch', 'Tijjani Reijnders', 'Teun Koopmeiners', 'Marten de Roon', 'Quinten Timber', 'Guus Til'],
    fwd: ['Memphis Depay', 'Cody Gakpo', 'Donyell Malen', 'Justin Kluivert', 'Brian Brobbey', 'Noa Lang', 'Crysencio Summerville', 'Wout Weghorst'],
  },
  nzl: {
    gk: ['Max Crocombe', 'Alex Paulsen', 'Michael Woud'],
    def: ['Tim Payne', 'Francis de Vries', 'Tyler Bindon', 'Michael Boxall', 'Liberato Cacace', 'Nando Pijnaker', 'Finn Surman', 'Callan Elliot', 'Tommy Smith'],
    mid: ['Joe Bell', 'Marko Stamenić', 'Alex Rufer', 'Ryan Thomas', 'Lachlan Bayliss', 'Sarpreet Singh', 'Elijah Just', 'Ben Old', 'Callum McCowatt'],
    fwd: ['Chris Wood', 'Matt Garbett', 'Kosta Barbarouses', 'Ben Waine', 'Jesse Randall'],
  },
  nor: {
    gk: ['Ørjan Nyland', 'Egil Selvik', 'Sander Tangvik'],
    def: ['Julian Ryerson', 'Marcus Holmgren Pedersen', 'David Møller Wolfe', 'Fredrik André Bjørkan', 'Kristoffer Ajer', 'Torbjørn Heggem', 'Leo Østigård', 'Sondre Langås', 'Henrik Falchener'],
    mid: ['Martin Ødegaard', 'Sander Berge', 'Fredrik Aursnes', 'Patrick Berg', 'Kristian Thorstvedt', 'Morten Thorsby', 'Thelo Aasgaard', 'Antonio Nusa', 'Oscar Bobb', 'Andreas Schjelderup', 'Jens Petter Hauge'],
    fwd: ['Erling Haaland', 'Alexander Sørloth', 'Jørgen Strand Larsen'],
  },
  pan: {
    gk: ['Orlando Mosquera', 'Luis Mejía', 'César Samudio'],
    def: ['Michael Amir Murillo', 'César Blackman', 'Jorge Gutiérrez', 'Fidel Escobar', 'Andrés Andrade', 'Edgardo Fariña', 'José Córdoba', 'Éric Davis', 'Jiovany Ramos', 'Roderick Miller'],
    mid: ['Aníbal Godoy', 'Adalberto Carrasquilla', 'Carlos Harvey', 'Cristian Martínez', 'José Luis Rodríguez', 'César Yanis', 'Yoel Bárcenas', 'Alberto Quintero', 'Azarías Londoño'],
    fwd: ['Ismael Díaz', 'Cecilio Waterman', 'José Fajardo', 'Tomás Rodríguez'],
  },
  sco: {
    gk: ['Craig Gordon', 'Angus Gunn', 'Liam Kelly'],
    def: ['Andy Robertson', 'Grant Hanley', 'Kieran Tierney', 'Scott McKenna', 'Jack Hendry', 'Nathan Patterson', 'Anthony Ralston', 'John Souttar', 'Aaron Hickey', 'Dominic Hyam'],
    mid: ['John McGinn', 'Scott McTominay', 'Ryan Christie', 'Kenny McLean', 'Lewis Ferguson', 'Ben Gannon-Doak', 'Findlay Curtis', 'Tyler Fletcher'],
    fwd: ['Lyndon Dykes', 'Che Adams', 'Lawrence Shankland', 'George Hirst', 'Ross Stewart'],
  },
  swe: {
    gk: ['Jacob Widell Zetterström', 'Viktor Johansson', 'Kristoffer Nordfeldt'],
    def: ['Gustaf Lagerbielke', 'Victor Lindelöf', 'Isak Hien', 'Gabriel Gudmundsson', 'Herman Johansson', 'Daniel Svensson', 'Hjalmar Ekdal', 'Carl Starfelt', 'Eric Smith', 'Elliot Stroud'],
    mid: ['Lucas Bergvall', 'Jesper Karlström', 'Yasin Ayari', 'Mattias Svanberg', 'Besfort Zeneli'],
    fwd: ['Alexander Isak', 'Benjamin Nygren', 'Anthony Elanga', 'Ken Sema', 'Viktor Gyökeres', 'Alexander Bernhardsson', 'Gustaf Nilsson', 'Taha Ali'],
  },
  sui: {
    gk: ['Gregor Kobel', 'Yvon Mvogo', 'Marvin Keller'],
    def: ['Miro Muheim', 'Silvan Widmer', 'Nico Elvedi', 'Manuel Akanji', 'Ricardo Rodríguez', 'Eray Cömert', 'Aurèle Amenda', 'Luca Jaquez'],
    mid: ['Denis Zakaria', 'Remo Freuler', 'Granit Xhaka', 'Johan Manzambi', 'Ardon Jashari', 'Djibril Sow', 'Christian Fassnacht', 'Michel Aebischer', 'Fabian Rieder'],
    fwd: ['Breel Embolo', 'Dan Ndoye', 'Rubén Vargas', 'Noah Okafor', 'Zeki Amdouni', 'Cedric Itten'],
  },
  tun: {
    gk: ['Aymen Dahmen', 'Sabri Ben Hessen', 'Mouhib Chamakh'],
    def: ['Montassar Talbi', 'Dylan Bronn', 'Ali Abdi', 'Yan Valery', 'Mohamed Amine Ben Hamida', 'Moutaz Neffati', 'Omar Rekik', 'Adem Arous', 'Raed Chikhaoui'],
    mid: ['Ellyes Skhiri', 'Hannibal Mejbri', 'Anis Ben Slimane', 'Mortadha Ben Ouanes', 'Ismaël Gharbi', 'Hadj Mahmoud', 'Rani Khedira'],
    fwd: ['Elias Achouri', 'Firas Chaouat', 'Hazem Mastouri', 'Elias Saad', 'Sebastian Tounekti', 'Khalil Ayari', 'Rayan Elloumi'],
  },
  uru: {
    gk: ['Fernando Muslera', 'Sergio Rochet', 'Santiago Mele'],
    def: ['José María Giménez', 'Ronald Araújo', 'Sebastián Cáceres', 'Santiago Bueno', 'Mathías Olivera', 'Guillermo Varela', 'Joaquín Piquerez', 'Matías Viña'],
    mid: ['Federico Valverde', 'Rodrigo Bentancur', 'Manuel Ugarte', 'Nicolás De La Cruz', 'Giorgian De Arrascaeta', 'Facundo Pellistri', 'Maximiliano Araújo', 'Brian Rodríguez', 'Agustín Canobbio', 'Rodrigo Zalazar', 'Emiliano Martínez', 'Juan Manuel Sanabria'],
    fwd: ['Darwin Núñez', 'Rodrigo Aguirre', 'Federico Viñas'],
  },
  usa: {
    gk: ['Matt Turner', 'Matt Freese', 'Chris Brady'],
    def: ['Sergiño Dest', 'Antonee Robinson', 'Chris Richards', 'Tim Ream', 'Mark McKenzie', 'Miles Robinson', 'Joe Scally', 'Auston Trusty', 'Alex Freeman', 'Max Arfsten'],
    mid: ['Tyler Adams', 'Weston McKennie', 'Gio Reyna', 'Malik Tillman', 'Cristian Roldan', 'Sebastian Berhalter'],
    fwd: ['Christian Pulisic', 'Tim Weah', 'Folarin Balogun', 'Ricardo Pepi', 'Brenden Aaronson', 'Haji Wright', 'Alex Zendejas'],
  },

  // ─── Provisional (расширенные списки) ─────────────────────────────────────

  alg: {
    gk: ['Luca Zidane', 'Oussama Benbot', 'Melvin Mastil', 'Abdelatif Ramdane'],
    def: ['Aïssa Mandi', 'Rayan Aït-Nouri', 'Ramy Bensebaini', 'Rafik Belghali', 'Samir Chergui', 'Jaouen Hadjam', 'Zineddine Belaïd', 'Achref Abada', 'Mohamed Amine Tougaï'],
    mid: ['Houssem Aouar', 'Farès Chaïbi', 'Ramiz Zerrouki', 'Ibrahim Maza', 'Nabil Bentaleb', 'Hicham Boudaoui', 'Yacine Titraoui'],
    fwd: ['Riyad Mahrez', 'Mohamed Amine Amoura', 'Amine Gouiri', 'Anis Hadj Moussa', 'Adil Boulbina', 'Farès Ghedjemis', 'Nadhir Benbouali'],
  },
  arg: {
    gk: ['Emiliano Martínez', 'Gerónimo Rulli', 'Juan Musso', 'Walter Benítez', 'Facundo Cambeses', 'Santiago Beltrán'],
    def: ['Agustín Giay', 'Gonzalo Montiel', 'Nahuel Molina', 'Nicolás Capaldo', 'Kevin Mac Allister', 'Lucas Martínez Quarta', 'Marcos Senesi', 'Lisandro Martínez', 'Nicolás Otamendi', 'Germán Pezzella', 'Leonardo Balerdi', 'Cristian Romero', 'Lautaro Di Lollo', 'Zaid Romero', 'Facundo Medina', 'Marcos Acuña', 'Nicolás Tagliafico', 'Gabriel Rojas'],
    mid: ['Máximo Perrone', 'Leandro Paredes', 'Guido Rodríguez', 'Aníbal Moreno', 'Milton Delgado', 'Alan Varela', 'Ezequiel Fernández', 'Rodrigo De Paul', 'Exequiel Palacios', 'Enzo Fernández', 'Alexis Mac Allister', 'Giovani Lo Celso', 'Nicolás Domínguez', 'Emiliano Buendía', 'Valentín Barco'],
    fwd: ['Lionel Messi', 'Nicolás Paz', 'Franco Mastantuono', 'Thiago Almada', 'Tomás Aranda', 'Nicolás González', 'Alejandro Garnacho', 'Giuliano Simeone', 'Matías Soulé', 'Claudio Echeverri', 'Gianluca Prestianni', 'Santiago Castro', 'Lautaro Martínez', 'José Manuel López', 'Julián Álvarez', 'Mateo Pellegrino'],
  },
  cze: {
    gk: ['Matěj Kovář', 'Jindřich Staněk', 'Martin Jedlička', 'Lukáš Horníček', 'Antonín Kinský', 'Jan Koutný', 'Jakub Markovič'],
    def: ['Vladimír Coufal', 'Tomáš Holeš', 'Ladislav Krejčí', 'David Zima', 'Jaroslav Zelený', 'David Jurásek', 'David Douděra', 'Robin Hranáč', 'Václav Jemelka', 'Martin Vitík', 'Štěpán Chaloupek', 'Tomáš Vlček', 'Matěj Hadaš', 'Adam Ševínský', 'Karel Spáčil'],
    mid: ['Tomáš Souček', 'Vladimír Darida', 'Lukáš Provod', 'Michal Sadílek', 'Pavel Šulc', 'Lukáš Červ', 'Adam Karabec', 'Michal Beran', 'Lukáš Sadílek', 'Kryštof Daněk', 'Matěj Ryneš', 'Patrik Hellebrand', 'Tomáš Ladra', 'Lukáš Ambros', 'Pavel Bucha', 'Ondřej Kričfaluši', 'David Planka', 'Hugo Sochůrek', 'Alexandr Sojka', 'Denis Višinský'],
    fwd: ['Patrik Schick', 'Matěj Vydra', 'Adam Hložek', 'Jan Kuchta', 'Tomáš Chorý', 'Mojmír Chytil', 'Jan Kliment', 'Vasil Kušej', 'Václav Sejk', 'Christophe Kabongo', 'Ondřej Mihálik', 'Vojtěch Patrák'],
  },
  egy: {
    gk: ['Mohamed El-Shenawy', 'Mostafa Shobeir', 'El-Mahdi Soliman', 'Mohamed Alaa'],
    def: ['Mohamed Hany', 'Tarek Alaa', 'Hamdy Fathy', 'Rami Rabia', 'Yasser Ibrahim', 'Hossam Abdelmaguid', 'Mohamed Abdelmonem', 'Ahmed Fatouh', 'Karim Hafez'],
    mid: ['Marwan Ateya', 'Mohanad Lasheen', 'Nabil Emad', 'Mahmoud Saber', 'Ahmed Sayed Zizo', 'Emam Ashour', 'Mostafa Ziko', 'Mahmoud Trezeguet', 'Ibrahim Adel', 'Haissem Hassan'],
    fwd: ['Mohamed Salah', 'Omar Marmoush', 'Aqtay Abdallah', 'Hamza Abdelkarim'],
  },
  irn: {
    gk: ['Alireza Beiranvand', 'Payam Niazmand', 'Hossein Hosseini', 'Mohammad Khalife'],
    def: ['Ehsan Hajsafi', 'Milad Mohammadi', 'Ramin Rezaeian', 'Hossein Kanaanizadegan', 'Shojae Khalilzadeh', 'Saleh Hardani', 'Ali Nemati', 'Aria Yousefi', 'Danial Eiri'],
    mid: ['Alireza Jahanbakhsh', 'Saeid Ezatolahi', 'Saman Ghoddos', 'Mehdi Torabi', 'Rouzbeh Cheshmi', 'Omid Noorafkan', 'Mohammad Mohebi', 'Mohammad Ghorbani', 'Amirmohammad Razzaghinia', 'Hadi Habibinejad'],
    fwd: ['Mehdi Taremi', 'Mehdi Ghayedi', 'Amirhossein Hosseinzadeh', 'Ali Alipour', 'Kasra Taheri', 'Amirhossein Mahmoudi', 'Dennis Eckert'],
  },
  irq: {
    gk: ['Jalal Hassan', 'Fahad Talib', 'Ahmed Basil', 'Kumel Al-Rekabe'],
    def: ['Rebin Sulaka', 'Manaf Younis', 'Merchas Doski', 'Hussein Ali', 'Zaid Tahseen', 'Frans Putros', 'Maitham Jabbar', 'Ahmed Yahya', 'Mustafa Saadoon', 'Akam Hashim', 'Ahmed Maknzi', 'Dario Naamo'],
    mid: ['Ibrahim Bayesh', 'Amir Al-Ammari', 'Ali Jasim', 'Youssef Amyn', 'Zidane Iqbal', 'Hasan Abdulkareem', 'Marko Farji', 'Karrar Nabeel', 'Kevin Yakob', 'Aimar Sher', 'Zaid Ismail', 'Peter Gwargis', 'Jussef Nasrawe', 'Ahmed Qasem'],
    fwd: ['Aymen Hussein', 'Mohanad Ali', 'Ali Al-Hamadi', 'Ali Yousif'],
  },
  jor: {
    gk: ['Yazeed Abulaila', 'Abdallah Al-Fakhouri', 'Nour Bani Attiah'],
    def: ['Ihsan Haddad', 'Yazan Al-Arab', 'Abdallah Nasib', 'Saed Al-Rosan', 'Husam Abu Dahab', 'Mo Abualnadi', 'Salim Obaid', 'Anas Badawi', 'Mohammad Abu Hashish', 'Mohannad Abu Taha'],
    mid: ['Rajaei Ayed', 'Noor Al-Rawabdeh', 'Ibrahim Sadeh', 'Nizar Al-Rashdan', 'Amer Jamous', 'Mohammad Al-Dawoud', 'Yousef Qashi', 'Mohammad Taha'],
    fwd: ['Mousa Al-Tamari', 'Mahmoud Al-Mardi', 'Ali Olwan', 'Mohammad Abu Zraiq', 'Odeh Al-Fakhouri', 'Ibrahim Sabra', 'Ali Azaizeh'],
  },
  qat: {
    gk: ['Meshaal Barsham', 'Salah Zakaria', 'Mahmud Abunada', 'Shehab Ellethy'],
    def: ['Boualem Khoukhi', 'Pedro Miguel', 'Homam Ahmed', 'Lucas Mendes', 'Sultan Al-Brake', 'Al-Hashmi Al-Hussain', 'Ayoub Al-Oui', 'Issa Laye', 'Rayyan Al-Ali'],
    mid: ['Abdulaziz Hatem', 'Karim Boudiaf', 'Assim Madibo', 'Ahmed Fathi', 'Jassem Gaber', 'Mohamed Al-Mannai', 'Tahsin Jamshid'],
    fwd: ['Hassan Al-Haydos', 'Akram Afif', 'Almoez Ali', 'Mohammed Muntari', 'Ahmed Alaaeldin', 'Yusuf Abdurisag', 'Edmilson Junior', 'Ahmed Al-Ganehi'],
  },
  sen: {
    gk: ['Édouard Mendy', 'Mory Diaw', 'Yehvann Diouf'],
    def: ['Kalidou Koulibaly', 'Krépin Diatta', 'Antoine Mendy', 'El Hadji Malick Diouf', 'Mamadou Sarr', 'Moussa Niakhaté', 'Moustapha Mbow', 'Abdoulaye Seck', 'Ismail Jakobs', 'Ilay Camara'],
    mid: ['Idrissa Gana Gueye', 'Pape Gueye', 'Lamine Camara', 'Habib Diarra', 'Pathé Ciss', 'Pape Matar Sarr', 'Bara Sapoko Ndiaye'],
    fwd: ['Sadio Mané', 'Ismaïla Sarr', 'Iliman Ndiaye', 'Nicolas Jackson', 'Assane Diao', 'Ibrahim Mbaye', 'Bamba Dieng', 'Chérif Ndiaye'],
  },
  tur: {
    gk: ['Uğurcan Çakır', 'Mert Günok', 'Altay Bayındır', 'Ersin Destanoğlu', 'Muhammed Şengezer'],
    def: ['Merih Demiral', 'Zeki Çelik', 'Çağlar Söyüncü', 'Mert Müldür', 'Ferdi Kadıoğlu', 'Ozan Kabak', 'Abdülkerim Bardakcı', 'Eren Elmalı', 'Samet Akaydin', 'Yusuf Akçiçek', 'Mustafa Eskihellaç', 'Ahmetcan Kaplan'],
    mid: ['Hakan Çalhanoğlu', 'Kaan Ayhan', 'Orkun Kökçü', 'İsmail Yüksek', 'Salih Özcan', 'Atakan Karazor', 'Demir Ege Tıknaz'],
    fwd: ['Kerem Aktürkoğlu', 'İrfan Can Kahveci', 'Barış Alper Yılmaz', 'Arda Güler', 'Kenan Yıldız', 'Yunus Akgün', 'Oğuz Aydın', 'Deniz Gül', 'Yusuf Sarı', 'Can Uzun', 'Aral Şimşir'],
  },
  mex: {
    gk: ['Guillermo Ochoa', 'Raúl Rangel', 'Carlos Acevedo', 'José Antonio Rodríguez', 'Carlos Moreno', 'Alex Padilla'],
    def: ['Jesús Gallardo', 'César Montes', 'Jorge Sánchez', 'Johan Vásquez', 'Israel Reyes', 'Jesús Alberto Angulo', 'Julián Araujo', 'Mateo Chávez', 'Víctor Guzmán', 'Richard Ledezma', 'Everardo López', 'Denzell García', 'Bryan González', 'Ramón Juárez', 'Eduardo Águila', 'Alejandro Gómez', 'Luis Rey'],
    mid: ['Edson Álvarez', 'Orbelín Pineda', 'Carlos Rodríguez', 'Roberto Alvarado', 'Luis Romo', 'Luis Chávez', 'Érick Sánchez', 'Diego Lainez', 'Érik Lira', 'Marcel Ruiz', 'Efraín Álvarez', 'Brian Gutiérrez', 'Alexis Gutiérrez', 'Gilberto Mora', 'Obed Vargas', 'Jesús Ricardo Angulo', 'Jordán Carrillo', 'Kevin Castañeda', 'Álvaro Fidalgo', 'Jorge Ruvalcaba', 'Alexéi Domínguez', 'Jeremy Márquez', 'Elías Montiel', 'Isaías Violante'],
    fwd: ['Raúl Jiménez', 'Alexis Vega', 'Santiago Giménez', 'César Huerta', 'Julián Quiñones', 'Germán Berterame', 'Guillermo Martínez', 'Armando González'],
  },
  ksa: {
    gk: ['Nawaf Al-Aqidi', 'Mohammed Al-Owais', 'Ahmed Al-Kassar', 'Abdul Quddus Atiah'],
    def: ['Saud Abdulhamid', 'Jihad Zakari', 'Abdulilah Al-Omari', 'Hassan Tambakti', 'Ali Lajami', 'Hassan Kadish'],
    mid: ['Ali Majrashi', 'Mohammed Abu Al-Shamat', 'Nasser Al-Dawsari', 'Mohammed Kanoo', 'Abdullah Al-Khaibari', 'Muteb Al-Harbi', 'Nawaf Boushal'],
    fwd: ['Salem Al-Dawsari', 'Saleh Al-Shehri', 'Abdullah Al-Hamdan', 'Ayman Yahya', 'Saleh Abu Al-Shamat', 'Sultan Mandash', 'Alaa Al-Haji', 'Musab Al-Juwair', 'Ziyad Al-Juhani', 'Abdullah Al-Salem', 'Khalid Al-Ghannam'],
  },
  par: {
    gk: ['Roberto Fernández', 'Orlando Gill', 'Aldo Pérez'],
    def: ['Gustavo Gómez', 'Junior Alonso', 'Juan Cáceres', 'Blas Riveros', 'Gustavo Velázquez', 'Alan Benítez', 'Agustín Sández', 'Alexis Duarte'],
    mid: ['Miguel Almirón', 'Mathías Villasanti', 'Kaku', 'Andrés Cubas', 'Ramón Sosa', 'Diego Gómez', 'Damián Bobadilla', 'Braian Ojeda', 'Matías Galarza', 'Robert Piris da Motta', 'Álvaro Campuzano', 'Diego González', 'Hugo Cuenca', 'Mauricio Magalhães', 'Lucas Romero', 'Enso González', 'Rubén Lezcano'],
    fwd: ['Óscar Romero', 'Ángel Romero', 'Antonio Sanabria', 'Julio Enciso', 'Gabriel Ávalos', 'Carlos González', 'Alex Arce', 'Adam Bareiro', 'Lorenzo Melgarejo', 'Isidro Pitta', 'Ronaldo Martínez', 'Gustavo Caballero', 'Robert Morales', 'Adrián Alcaraz', 'Rodney Redes'],
  },
  por: {
    gk: ['Diogo Costa', 'José Sá', 'Rui Silva', 'Ricardo Velho'],
    def: ['João Cancelo', 'Diogo Dalot', 'Rúben Dias', 'Gonçalo Inácio', 'Nuno Mendes', 'Renato Veiga', 'Matheus Nunes', 'Nélson Semedo', 'Tomás Araújo'],
    mid: ['Bruno Fernandes', 'João Neves', 'Bernardo Silva', 'Vitinha', 'Rúben Neves', 'Samú Costa'],
    fwd: ['Cristiano Ronaldo', 'Rafael Leão', 'Pedro Neto', 'Francisco Conceição', 'João Félix', 'Gonçalo Guedes', 'Gonçalo Ramos', 'Francisco Trincão'],
  },
  rsa: {
    gk: ['Ronwen Williams', 'Ricardo Goss', 'Sipho Chaine', 'Brandon Petersen'],
    def: ['Aubrey Modiba', 'Khuliso Mudau', 'Nkosinathi Sibisi', 'Mbekezeli Mbokazi', 'Ime Okon', 'Samukele Kabini', 'Khulumani Ndamane', 'Thabang Matuludi', 'Thabiso Monyane', 'Bradley Cross', 'Olwethu Makhanya'],
    mid: ['Themba Zwane', 'Teboho Mokoena', 'Sphephelo Sithole', 'Lebohang Maboe', 'Thalente Mbatha', 'Jayden Adams', 'Brooklyn Poggenpoel'],
    fwd: ['Thapelo Morena', 'Lyle Foster', 'Evidence Makgopa', 'Oswin Appollis', 'Iqraam Rayners', 'Relebohile Mofokeng', 'Thapelo Maseko', 'Tshepang Moremi', 'Patrick Maswanganyi', 'Kamogelo Sebelebele'],
  },
  uzb: {
    gk: ['Vladimir Nazarov', 'Utkir Yusupov', 'Botirali Ergashev', 'Abduvokhid Nematov'],
    def: ['Ibrohimkhalil Yuldoshev', 'Avazbek Ulmasaliev', 'Jakhongir Urozov', 'Rustamjon Ashurmatov', 'Mukhammadkodir Hamraliev', 'Umarbek Eshmurodov', 'Abdukodir Khusanov', 'Abdulla Abdullaev', 'Farrukh Sayfiev', 'Khojiakbar Alijonov', 'Sherzod Nasrullaev', 'Muhammadrasul Abdumajidov', 'Behruz Karimov', 'Diyor Ortikboev'],
    mid: ['Kuvondik Ruziev', 'Sherzod Esanov', 'Nodirbek Abdurazzokov', 'Odiljon Khamrobekov', 'Umarali Rakhmonaliev', 'Alisher Odilov', 'Sardorbek Rakhmonov', 'Akmal Mozgovoy', 'Otabek Shukurov', 'Jamshid Iskanderov', 'Jasurbek Jaloliddinov', 'Azizjon Ganiev'],
    fwd: ['Abbosbek Fayzullaev', 'Jaloliddin Masharipov', 'Dostonbek Khamdamov', 'Oston Urunov', 'Ruslanbek Jiyanov', 'Azizbek Amonov', 'Khusain Norchaev', 'Sherzod Temirov', 'Igor Sergeev', 'Eldor Shomurodov'],
  },

  // ─── Ещё не объявили (3 сборных) ─────────────────────────────────────────

  aus: {
    gk: ['Mathew Ryan', 'Joe Gauci'],
    def: ['Harry Souttar', 'Kye Rowles', 'Aziz Behich', 'Thomas Deng'],
    mid: ['Jackson Irvine', 'Riley McGree', 'Keanu Bacchus', 'Aiden O\'Neill'],
    fwd: ['Mitchell Duke', 'Kusini Yengi', 'Martin Boyle', 'Jamie Maclaren'],
  },
  ecu: {
    gk: ['Hernán Galíndez', 'Alexander Domínguez'],
    def: ['Piero Hincapié', 'Felix Torres', 'Angelo Preciado', 'Robert Arboleda'],
    mid: ['Moisés Caicedo', 'Kendry Páez', 'Carlos Gruezo'],
    fwd: ['Enner Valencia', 'Willian Pacho', 'Jordy Caicedo'],
  },
  gha: {
    gk: ['Lawrence Ati-Zigi', 'Richard Ofori'],
    def: ['Daniel Amartey', 'Alexander Djiku', 'Mohammed Salisu', 'Gideon Mensah'],
    mid: ['Thomas Partey', 'Mohammed Kudus', 'André Ayew', 'Joseph Paintsil'],
    fwd: ['Jordan Ayew', 'Ernest Nuamah', 'Antoine Semenyo'],
  },
};
