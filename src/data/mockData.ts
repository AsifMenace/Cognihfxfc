// Mock data for the football club website

export interface Player {
  id: number;
  name: string;
  position: string;
  age: number;
  nationality: string;
  jerseyNumber: number;
  height: string;
  weight: string;
  goals: number;
  assists: number;
  appearances: number;
  photo: string;
  bio: string;
}

export interface Game {
  id: number;
  opponent: string;
  date: string;
  time: string;
  venue: string;
  isHome: boolean;
  competition: string;
  status: 'upcoming' | 'live' | 'finished';
}

export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  category: 'match' | 'training' | 'celebration' | 'team';
}

export const players: Player[] = [
  {
    id: 1,
    name: "Marcus Johnson",
    position: "Goalkeeper",
    age: 28,
    nationality: "England",
    jerseyNumber: 1,
    height: "6'3\"",
    weight: "185 lbs",
    goals: 0,
    assists: 2,
    appearances: 25,
    photo: "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    bio: "Reliable goalkeeper with excellent reflexes and leadership qualities. Known for his ability to organize the defense and make crucial saves in important moments."
  },
  {
    id: 2,
    name: "James Rodriguez",
    position: "Defender",
    age: 26,
    nationality: "Spain",
    jerseyNumber: 4,
    height: "6'1\"",
    weight: "175 lbs",
    goals: 3,
    assists: 5,
    appearances: 28,
    photo: "https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    bio: "Strong central defender with excellent aerial ability and tactical awareness. A natural leader who reads the game exceptionally well."
  },
  {
    id: 3,
    name: "Alex Thompson",
    position: "Midfielder",
    age: 24,
    nationality: "England",
    jerseyNumber: 8,
    height: "5'10\"",
    weight: "165 lbs",
    goals: 12,
    assists: 8,
    appearances: 30,
    photo: "https://images.pexels.com/photos/3621202/pexels-photo-3621202.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    bio: "Creative midfielder with excellent passing range and vision. Known for his ability to create chances and score crucial goals from midfield."
  },
  {
    id: 4,
    name: "David Silva",
    position: "Forward",
    age: 22,
    nationality: "Brazil",
    jerseyNumber: 10,
    height: "5'8\"",
    weight: "160 lbs",
    goals: 18,
    assists: 12,
    appearances: 29,
    photo: "https://images.pexels.com/photos/3621225/pexels-photo-3621225.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    bio: "Pacey winger with exceptional dribbling skills and an eye for goal. His speed and creativity make him a constant threat to opposing defenses."
  },
  {
    id: 5,
    name: "Lucas Martinez",
    position: "Forward",
    age: 25,
    nationality: "Argentina",
    jerseyNumber: 9,
    height: "6'0\"",
    weight: "170 lbs",
    goals: 22,
    assists: 6,
    appearances: 27,
    photo: "https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    bio: "Clinical striker with excellent finishing ability. Known for his positioning in the box and ability to score goals in crucial moments."
  },
  {
    id: 6,
    name: "Tom Wilson",
    position: "Defender",
    age: 27,
    nationality: "England",
    jerseyNumber: 3,
    height: "5'11\"",
    weight: "172 lbs",
    goals: 1,
    assists: 7,
    appearances: 26,
    photo: "https://images.pexels.com/photos/3621193/pexels-photo-3621193.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    bio: "Versatile full-back who contributes both defensively and offensively. Known for his pace and ability to deliver quality crosses from wide positions."
  },
  {
    id: 7,
    name: "Ryan O'Connor",
    position: "Midfielder",
    age: 23,
    nationality: "Ireland",
    jerseyNumber: 6,
    height: "5'9\"",
    weight: "158 lbs",
    goals: 5,
    assists: 11,
    appearances: 31,
    photo: "https://images.pexels.com/photos/3621227/pexels-photo-3621227.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    bio: "Energetic box-to-box midfielder with great work rate and technical skills. Excellent at breaking up play and starting counter-attacks."
  },
  {
    id: 8,
    name: "Antonio Costa",
    position: "Defender",
    age: 29,
    nationality: "Portugal",
    jerseyNumber: 2,
    height: "6'2\"",
    weight: "180 lbs",
    goals: 2,
    assists: 3,
    appearances: 24,
    photo: "https://images.pexels.com/photos/3621178/pexels-photo-3621178.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    bio: "Experienced defender with strong leadership qualities. Known for his defensive solidity and ability to mentor younger players."
  }
];

export const upcomingGames: Game[] = [
  {
    id: 1,
    opponent: "Manchester United",
    date: "2025-02-15",
    time: "15:00",
    venue: "Old Trafford",
    isHome: false,
    competition: "Premier League",
    status: "upcoming"
  },
  {
    id: 2,
    opponent: "Arsenal",
    date: "2025-02-22",
    time: "17:30",
    venue: "Stamford Bridge",
    isHome: true,
    competition: "Premier League",
    status: "upcoming"
  },
  {
    id: 3,
    opponent: "Liverpool",
    date: "2025-03-01",
    time: "14:00",
    venue: "Anfield",
    isHome: false,
    competition: "FA Cup",
    status: "upcoming"
  },
  {
    id: 4,
    opponent: "Tottenham",
    date: "2025-03-08",
    time: "16:00",
    venue: "Stamford Bridge",
    isHome: true,
    competition: "Premier League",
    status: "upcoming"
  },
  {
    id: 5,
    opponent: "Newcastle",
    date: "2025-03-15",
    time: "15:00",
    venue: "St. James' Park",
    isHome: false,
    competition: "Premier League",
    status: "upcoming"
  }
];

export const galleryImages: GalleryImage[] = [
  {
    id: 1,
    src: "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Team celebrating goal",
    category: "celebration"
  },
  {
    id: 2,
    src: "https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Training session",
    category: "training"
  },
  {
    id: 3,
    src: "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Match action",
    category: "match"
  },
  {
    id: 4,
    src: "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Team photo",
    category: "team"
  },
  {
    id: 5,
    src: "https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Player in action",
    category: "match"
  },
  {
    id: 6,
    src: "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Stadium view",
    category: "match"
  },
  {
    id: 7,
    src: "https://images.pexels.com/photos/3621202/pexels-photo-3621202.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Training drill",
    category: "training"
  },
  {
    id: 8,
    src: "https://images.pexels.com/photos/3621225/pexels-photo-3621225.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Victory celebration",
    category: "celebration"
  },
  {
    id: 9,
    src: "https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Match preparation",
    category: "training"
  }
];