export type CauseType =
  | 'Education'
  | 'Healthcare'
  | 'Child Welfare'
  | 'Poverty Alleviation & Livelihoods'
  | 'Women Empowerment'
  | 'Disaster Relief'
  | 'Environment & Sustainability'
  | 'Animal Welfare'
  | 'Support for Persons with Disabilities'
  | 'Elderly Care'
  | 'Water, Sanitation, and Hygiene (WASH)'
  | 'Rural Development';

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  cause: CauseType;
  distanceKm: number; // For location matching
  durationHrs: number; // e.g., 1.5, 3
  locationName: string;
  isRemote: boolean;
  datePosted: Date;
  organizationName: string;
  organizationLogo: string;
  friendsSignedUpCount: number;
  friendsSignedUpNames: string[];
  categoryTag: string;
}

export type SignalType =
  // Positive Signals
  | 'Save'
  | 'Share'
  | 'OpenProfile'
  | 'SignUp'
  | 'Attend'
  | 'Support'
  | 'TagFriends'
  | 'CompleteStory'
  // Negative Signals
  | 'ScrollAway'
  | 'SkipStory'
  | 'Ignore'
  | 'DismissCause';

// Default onboarding affinities (initial state)
const DEFAULT_AFFINITIES: Record<CauseType, number> = {
  'Education': 50,
  'Healthcare': 40,
  'Child Welfare': 45,
  'Poverty Alleviation & Livelihoods': 30,
  'Women Empowerment': 35,
  'Disaster Relief': 20,
  'Environment & Sustainability': 25,
  'Animal Welfare': 15,
  'Support for Persons with Disabilities': 20,
  'Elderly Care': 25,
  'Water, Sanitation, and Hygiene (WASH)': 10,
  'Rural Development': 15,
};

// Signal Weights
const SIGNAL_WEIGHTS: Record<SignalType, number> = {
  Save: 10,
  Share: 10,
  OpenProfile: 5,
  SignUp: 25,
  Attend: 30,
  Support: 15,
  TagFriends: 15,
  CompleteStory: 20,
  ScrollAway: -10,
  SkipStory: -15,
  Ignore: -5,
  DismissCause: -20,
};

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp_1',
    title: 'Mentoring Students',
    description: 'Spend a few hours mentoring students and helping them build confidence through reading.',
    cause: 'Education',
    distanceKm: 3.2,
    durationHrs: 1.5,
    locationName: 'Gudi guda ka naka, Gwalior',
    isRemote: false,
    datePosted: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    organizationName: 'Pratham MP Education Group',
    organizationLogo: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=80',
    friendsSignedUpCount: 9,
    friendsSignedUpNames: ['anita', 'sunita', 'rahul', 'vivek'],
    categoryTag: 'Reading Club',
  },
  {
    id: 'opp_2',
    title: 'Sort and Pack Medical Supplies',
    description: 'Help sort and package essential medicines and primary diagnostic kits for rural clinics.',
    cause: 'Healthcare',
    distanceKm: 4.8,
    durationHrs: 2.0,
    locationName: 'City Centre Clinic, Gwalior',
    isRemote: false,
    datePosted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    organizationName: 'Red Cross Gwalior',
    organizationLogo: 'https://images.unsplash.com/photo-1478479405421-ce83c92fb3ba?w=80',
    friendsSignedUpCount: 1,
    friendsSignedUpNames: ['vikram'],
    categoryTag: 'Clinic Support',
  },
  {
    id: 'opp_3',
    title: 'Evening Shelter Food Distribution',
    description: 'Help distribute warm dinner packets and verify overnight counts at community transit shelters.',
    cause: 'Poverty Alleviation & Livelihoods',
    distanceKm: 12.5,
    durationHrs: 3.0,
    locationName: 'Hazira Railway Crossing, Gwalior',
    isRemote: false,
    datePosted: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    organizationName: 'Robin Hood Army Gwalior',
    organizationLogo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80',
    friendsSignedUpCount: 4,
    friendsSignedUpNames: ['rohan', 'priya', 'sanjay', 'sneha'],
    categoryTag: 'Food Rescue',
  },
  {
    id: 'opp_4',
    title: 'Miyawaki Plantation drive',
    description: 'Help dig, soil-prep, and plant saplings in the urban Miyawaki forest zone to combat summer temperatures.',
    cause: 'Environment & Sustainability',
    distanceKm: 28.0,
    durationHrs: 4.0,
    locationName: 'Ghatigaon Forest Block',
    isRemote: false,
    datePosted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    organizationName: 'Green Gwalior Initiative',
    organizationLogo: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=80',
    friendsSignedUpCount: 0,
    friendsSignedUpNames: [],
    categoryTag: 'Afforestation',
  },
  {
    id: 'opp_5',
    title: 'Review Crop Hailstorm Relief Requests',
    description: 'Review field reports and remote photos of hailstorm damage to approve seed subsidy vouchers for farmers.',
    cause: 'Disaster Relief',
    distanceKm: 0,
    durationHrs: 1.0,
    locationName: 'Remote / Online',
    isRemote: true,
    datePosted: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
    organizationName: 'MP Disaster Management Authority',
    organizationLogo: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=80',
    friendsSignedUpCount: 2,
    friendsSignedUpNames: ['anita', 'sneha'],
    categoryTag: 'Data Verification',
  },
  {
    id: 'opp_6',
    title: 'Digitize Textbooks for Visually Impaired',
    description: 'Read and verify audio transcriptions of secondary school textbooks for visually impaired college students.',
    cause: 'Support for Persons with Disabilities',
    distanceKm: 0,
    durationHrs: 2.0,
    locationName: 'Remote / Online',
    isRemote: true,
    datePosted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    organizationName: 'NAB India Digitization Unit',
    organizationLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80',
    friendsSignedUpCount: 5,
    friendsSignedUpNames: ['rahul', 'priya', 'mohit', 'neha', 'sanjay'],
    categoryTag: 'Audio Recording',
  },
  {
    id: 'opp_7',
    title: 'Vaccination Campaign Social Media Design',
    description: 'Draft graphics and local language posters for stray dog anti-rabies vaccination drives.',
    cause: 'Animal Welfare',
    distanceKm: 0,
    durationHrs: 1.5,
    locationName: 'Remote / Online',
    isRemote: true,
    datePosted: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    organizationName: 'PFA Gwalior Unit',
    organizationLogo: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=80',
    friendsSignedUpCount: 0,
    friendsSignedUpNames: [],
    categoryTag: 'Creative Design',
  }
];

class PersonalizationManager {
  private affinities: Record<CauseType, number> = { ...DEFAULT_AFFINITIES };
  private userLocation = 'Gwalior';
  private listState: Opportunity[] = [ ...MOCK_OPPORTUNITIES ];

  public getRawOpportunities(): Opportunity[] {
    return this.listState;
  }


  // Record a user interaction signal and adjust affinity
  public recordSignal(cause: CauseType, signal: SignalType) {
    const weight = SIGNAL_WEIGHTS[signal] || 0;
    const currentScore = this.affinities[cause] || 0;
    
    // Clamp score between 0 and 100
    this.affinities[cause] = Math.max(0, Math.min(100, currentScore + weight));
    console.log(`Signal recorded: [${signal}] for [${cause}]. New Score: ${this.affinities[cause]}`);
  }

  // Get causes sorted by current user affinity (Section 2)
  public getSortedCauses(): CauseType[] {
    return (Object.keys(this.affinities) as CauseType[]).sort(
      (a, b) => this.affinities[b] - this.affinities[a]
    );
  }

  // Get current affinity score for a cause (0 to 1)
  public getAffinityFactor(cause: CauseType): number {
    return (this.affinities[cause] || 0) / 100;
  }

  // Rank opportunities based on user affinity, distance, social attendance, and recency
  // Score = 40% Cause affinity + 30% Distance + 20% Friends + 10% Recency
  public rankOpportunities(opportunities: Opportunity[]): Opportunity[] {
    const now = new Date().getTime();
    
    const scoredList = opportunities.map(opp => {
      // 1. Cause Affinity (0 to 40 points)
      const affinityPoints = this.getAffinityFactor(opp.cause) * 40;

      // 2. Distance Score (0 to 30 points)
      // Mapped: Remote = 30 points. Local (<=5km) = 30 points. Drops off as distance increases.
      let distancePoints = 0;
      if (opp.isRemote) {
        distancePoints = 30;
      } else {
        const dist = opp.distanceKm;
        if (dist <= 5) distancePoints = 30;
        else if (dist <= 15) distancePoints = 20;
        else if (dist <= 25) distancePoints = 15;
        else if (dist <= 50) distancePoints = 10;
        else if (dist <= 100) distancePoints = 5;
        else distancePoints = 2;
      }

      // 3. Friends Attending (0 to 20 points)
      // Max points reached if 3 or more friends sign up
      const friendsPoints = Math.min(20, (opp.friendsSignedUpCount / 3) * 20);

      // 4. Recency Score (0 to 10 points)
      // Fresh opportunities (posted within 48h) get maximum points. Older posts get decay.
      const ageHours = (now - opp.datePosted.getTime()) / (1000 * 60 * 60);
      let recencyPoints = 0;
      if (ageHours <= 24) recencyPoints = 10;
      else if (ageHours <= 72) recencyPoints = 8;
      else if (ageHours <= 168) recencyPoints = 5; // 1 week
      else recencyPoints = 2;

      const totalScore = affinityPoints + distancePoints + friendsPoints + recencyPoints;
      
      return {
        opp,
        score: totalScore,
      };
    });

    // Sort descending by score
    return scoredList.sort((a, b) => b.score - a.score).map(item => item.opp);
  }

  // Geolocation Fallback filtering:
  // 1. Local (<=5km)
  // 2. Expand to 25km
  // 3. Expand to 50km
  // 4. Expand to 100km
  // 5. Remote / Online
  // 6. Micro-volunteering fallback
  public getFilteredLocalOpportunities(opportunities: Opportunity[]): Opportunity[] {
    const activeLocal = opportunities.filter(o => !o.isRemote);
    
    // Step 1: Check Local (< 5km)
    let filtered = activeLocal.filter(o => o.distanceKm <= 5);
    if (filtered.length >= 2) return filtered;

    // Step 2: Expand to 25km
    filtered = activeLocal.filter(o => o.distanceKm <= 25);
    if (filtered.length >= 2) return filtered;

    // Step 3: Expand to 50km
    filtered = activeLocal.filter(o => o.distanceKm <= 50);
    if (filtered.length >= 2) return filtered;

    // Step 4: Expand to 100km
    filtered = activeLocal.filter(o => o.distanceKm <= 100);
    if (filtered.length >= 2) return filtered;

    // Step 5: If nothing local, return all remote/online opportunities
    const remote = opportunities.filter(o => o.isRemote);
    if (remote.length > 0) return remote;

    // Step 6: Fallback to micro-volunteering listings
    return opportunities.filter(o => o.durationHrs <= 2);
  }
}

export const Personalization = new PersonalizationManager();
