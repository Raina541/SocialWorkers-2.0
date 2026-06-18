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

  // --- Ideas and Social State Centralization ---
  private allowMentions = true;
  private supportTapsCount = 0;
  private ideas: Idea[] = [
    {
      id: 'idea_1',
      description: 'Developing community kitchen gardens in abandoned plots to provide organic vegetables to low-income senior citizens.',
      creatorName: 'Morar Neighborhood Council',
      creatorLogo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=80',
      initialSupports: 48,
      taggedFriends: ['anita', 'sunita'],
      mentionsCount: 25,
      isMentionedBadge: false,
    },
    {
      id: 'idea_2',
      description: 'Setting up roadside water dispensers (Pyaus) with bio-sand filtration systems for hot summer months.',
      creatorName: 'WASH Coalition Gwalior',
      creatorLogo: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=80',
      initialSupports: 92,
      taggedFriends: ['rahul'],
      mentionsCount: 14,
      isMentionedBadge: true, // Show "Rahul mentioned you" on this one to display badge feature
    },
  ];

  private notifications: NotificationItem[] = [
    {
      id: 'n_1',
      title: 'New Opportunity',
      body: 'Spend a few hours mentoring students and helping them build confidence through reading at Gudi guda ka naka.',
      category: 'Opportunity Update',
      timestamp: new Date(),
      timeLabel: '5m ago',
      unread: true,
      senderName: 'Pratham MP Education',
      senderLogo: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=80',
    },
    {
      id: 'n_2',
      title: 'Account Alert',
      body: 'Your account was accessed from a new device in Lashkar, Gwalior.',
      category: 'System Alert',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      timeLabel: '2h ago',
      unread: false,
      senderName: 'System Security',
      senderLogo: '',
    },
    {
      id: 'n_3',
      title: "Anita thinks you'd care about this idea",
      body: 'Anita tagged you in the Developing community kitchen gardens Idea Thread. Check it out!',
      category: 'New Message',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
      timeLabel: 'Yesterday, 4:30 PM',
      unread: true,
      senderName: 'anita (Friend)',
      senderLogo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
      ideaId: 'idea_1',
    },
    {
      id: 'n_4',
      title: 'Weekly Assembly Meeting',
      body: 'Weekly Gwalior environmental coalition meeting starts Sunday 10 AM at City Centre municipal hall.',
      category: 'Event Reminder',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28), // 28 hours ago
      timeLabel: 'Yesterday, 10:15 AM',
      unread: false,
      senderName: 'Green Gwalior Group',
      senderLogo: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=80',
    },
    {
      id: 'n_5',
      title: 'Community Announcements',
      body: 'CWS Taskforce has approved 4 new rural caseworkers. Welcome them in the community forum.',
      category: 'Community Announcement',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
      timeLabel: '12 Sept, 2:10 PM',
      unread: false,
      senderName: 'Child Welfare Service',
      senderLogo: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=80',
    },
    {
      id: 'n_6',
      title: 'New Achievement Earned',
      body: 'Congratulations! You unlocked the "Active Responder" badge for completing 3 micro-volunteering opportunities.',
      category: 'Achievement Badge',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago
      timeLabel: '10 Sept, 9:00 AM',
      unread: false,
      senderName: 'Achievement Portal',
      senderLogo: '',
    },
  ];

  public getAllowMentions(): boolean {
    return this.allowMentions;
  }

  public setAllowMentions(val: boolean) {
    this.allowMentions = val;
  }

  public getSupportTapsCount(): number {
    return this.supportTapsCount;
  }

  public incrementSupportTapsCount() {
    this.supportTapsCount += 1;
  }

  public getIdeas(): Idea[] {
    return this.ideas;
  }

  public updateIdea(ideaId: string, updated: Partial<Idea>) {
    this.ideas = this.ideas.map(idea => {
      if (idea.id === ideaId) {
        return { ...idea, ...updated };
      }
      return idea;
    });
  }

  public getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  public setNotifications(notifs: NotificationItem[]) {
    this.notifications = notifs;
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'timeLabel'>) {
    const newNotif: NotificationItem = {
      ...notif,
      id: `n_${Date.now()}`,
      timestamp: new Date(),
      timeLabel: 'Just now',
    };
    this.notifications = [newNotif, ...this.notifications];
  }
}

export interface Friend {
  username: string;
  displayName: string;
  avatar: string;
  recentInteraction?: boolean;
}

export const MOCK_FRIENDS: Friend[] = [
  { username: 'anita', displayName: 'Anita', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80', recentInteraction: true },
  { username: 'sunita', displayName: 'Sunita', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80', recentInteraction: true },
  { username: 'rahul', displayName: 'Rahul', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80', recentInteraction: true },
  { username: 'priya', displayName: 'Priya', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80', recentInteraction: false },
  { username: 'rohan', displayName: 'Rohan', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80', recentInteraction: false },
  { username: 'sneha', displayName: 'Sneha', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80', recentInteraction: false },
  { username: 'sanjay', displayName: 'Sanjay', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80', recentInteraction: false },
  { username: 'vivek', displayName: 'Vivek', avatar: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=80', recentInteraction: false },
  { username: 'neha', displayName: 'Neha', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80', recentInteraction: false },
];

export interface Idea {
  id: string;
  description: string;
  creatorName: string;
  creatorLogo: string;
  initialSupports: number;
  taggedFriends: string[];
  mentionsCount: number;
  isMentionedBadge?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category:
    | 'Opportunity Update'
    | 'Community Announcement'
    | 'Event Reminder'
    | 'New Message'
    | 'Connection Request'
    | 'Achievement Badge'
    | 'Application Status'
    | 'System Alert';
  timestamp: Date;
  timeLabel: string;
  unread: boolean;
  senderName: string;
  senderLogo: string;
  ideaId?: string;
}

export const Personalization = new PersonalizationManager();
