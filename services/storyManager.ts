import { CauseType } from './personalization';

export interface Story {
  id: string;
  headline: string;
  summary: string;
  imageUri: string;
  sourceName: string;
  contributorsCount: number;
  contributorsAvatars: string[];
  location: string;
  timestamp: string;
  publishedAt: number; // epoch timestamp in ms
  tags: string[];      // interest tags
}

// Generate dynamic timestamps so stories are always fresh relative to execution time
const now = Date.now();

const MOCK_STORIES_DB: Record<CauseType, Story[]> = {
  'Education': [
    {
      id: 'edu_1',
      headline: 'Digital Classrooms Bridge Rural Learning Gaps in Madhya Pradesh',
      summary: 'An NGO initiative has deployed 150 solar-powered digital tablets to schools across Chambal division, enabling interactive multimedia learning for over 4,500 children.',
      imageUri: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
      sourceName: 'The Hindu',
      contributorsCount: 4,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',
      ],
      location: 'Morena, MP',
      timestamp: '12 hours ago',
      publishedAt: now - 12 * 3600 * 1000,
      tags: ['digital', 'rural', 'children', 'tablet'],
    },
    {
      id: 'edu_2',
      headline: 'Evening Night Schools Empower Working Children in Gwalior',
      summary: 'Street-side night schools organized by local college volunteers are helping children working in markets complete their elementary certifications after work hours.',
      imageUri: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800',
      sourceName: 'Times of India',
      contributorsCount: 12,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80',
      ],
      location: 'Gwalior, India',
      timestamp: '2 days ago',
      publishedAt: now - 2 * 24 * 3600 * 1000,
      tags: ['volunteers', 'night', 'children', 'literacy'],
    },
    {
      id: 'edu_3',
      headline: 'Mobile Libraries Bring Books to Nomadic Tribe Settlements',
      summary: 'A converted minibus library loaded with 2,000 regional-language textbooks and fiction books completes a weekly loop of 12 temporary settlements in northern MP.',
      imageUri: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
      sourceName: 'Indian Express',
      contributorsCount: 0,
      contributorsAvatars: [],
      location: 'Bhind, India',
      timestamp: '5 days ago',
      publishedAt: now - 5 * 24 * 3600 * 1000,
      tags: ['library', 'mobile', 'rural', 'reading'],
    },
  ],
  'Healthcare': [
    {
      id: 'health_1',
      headline: 'Mobile Clinics Deliver Essential Diagnostics to Tribal Belts',
      summary: 'Fitted with digital ECG and blood scanners, diagnostic vans complete health checkups in remote regions, flagging high-risk cases for nearby district hospitals.',
      imageUri: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800',
      sourceName: 'National Health Mission',
      contributorsCount: 8,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
      ],
      location: 'Shivpuri Forest Area',
      timestamp: '1 day ago',
      publishedAt: now - 1 * 24 * 3600 * 1000,
      tags: ['diagnostics', 'forest', 'tribal', 'clinic'],
    },
  ],
  'Child Welfare': [
    {
      id: 'child_1',
      headline: 'Integrated Helplines Prevent Child Labor in Local Markets',
      summary: 'A joint coalition of local youth volunteers and district welfare officers rescued 14 minors from industrial setups, placing them in residential bridge schools.',
      imageUri: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
      sourceName: 'UNICEF India',
      contributorsCount: 5,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',
      ],
      location: 'Gwalior Industrial Area',
      timestamp: '3 days ago',
      publishedAt: now - 3 * 24 * 3600 * 1000,
      tags: ['labor', 'market', 'rescue', 'welfare'],
    },
  ],
  'Poverty Alleviation & Livelihoods': [
    {
      id: 'pov_1',
      headline: 'Self-Help Groups Scale Basket Weaving Exports globally',
      summary: 'A collective of 120 rural women received marketing support to sell handmade bamboo products online, doubling their average monthly household income.',
      imageUri: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800',
      sourceName: 'Ministry of Rural Dev',
      contributorsCount: 18,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80',
      ],
      location: 'Dabra Rural Block',
      timestamp: 'Yesterday',
      publishedAt: now - 20 * 3600 * 1000,
      tags: ['weaving', 'exports', 'online', 'livelihood'],
    },
  ],
  'Women Empowerment': [
    {
      id: 'women_1',
      headline: 'Free Digital Literacy Camps Launch for Rural Entrepreneurs',
      summary: 'In partnership with tech charities, 400 rural women completed training on building e-commerce profiles, basic online accounting, and banking security.',
      imageUri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
      sourceName: 'WCD India',
      contributorsCount: 6,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80',
      ],
      location: 'Gwalior City Centre',
      timestamp: '4 days ago',
      publishedAt: now - 4 * 24 * 3600 * 1000,
      tags: ['literacy', 'finance', 'entrepreneur', 'digital'],
    },
  ],
  'Disaster Relief': [
    {
      id: 'disaster_1',
      headline: 'Rapid Action Teams Deployed Post Hailstorms in MP Outskirts',
      summary: 'Emergency food distribution, plastic sheeting shelter kits, and crop evaluation support reached 200 family units within 18 hours of heavy crop damage.',
      imageUri: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
      sourceName: 'Red Cross India',
      contributorsCount: 22,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
      ],
      location: 'Ghatigaon Sub-district',
      timestamp: '6 days ago',
      publishedAt: now - 6 * 24 * 3600 * 1000,
      tags: ['hailstorm', 'food', 'emergency', 'relief'],
    },
  ],
  'Environment & Sustainability': [
    {
      id: 'env_1',
      headline: 'Miyawaki Micro-Forests Created in Urban Gwalior to Combat Heatwaves',
      summary: 'Volunteers planted 3,500 native saplings in a neglected municipal plot using the Miyawaki method, creating a dense green lung that reduces local ambient temperature.',
      imageUri: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800',
      sourceName: 'Daily Pioneer',
      contributorsCount: 38,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80',
      ],
      location: 'Lashkar, Gwalior',
      timestamp: '18 hours ago',
      publishedAt: now - 18 * 3600 * 1000,
      tags: ['miyawaki', 'forest', 'heatwave', 'urban'],
    },
    {
      id: 'env_2',
      headline: 'Rainwater Harvesting Wells Rejuvenate Groundwater Table in Semi-arid Village',
      summary: 'Building 18 ring wells around agricultural runoffs allowed rain-fed aquifers to replenish, bringing critical drinking water back to a community facing severe summer droughts.',
      imageUri: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800',
      sourceName: 'Down To Earth',
      contributorsCount: 14,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80',
      ],
      location: 'Morar Rural Area',
      timestamp: '4 days ago',
      publishedAt: now - 4 * 24 * 3600 * 1000,
      tags: ['rainwater', 'wells', 'drought', 'water'],
    },
  ],
  'Animal Welfare': [
    {
      id: 'animal_1',
      headline: 'Stray Animal Vaccination & Reflection Collar Drives Succeed',
      summary: 'Volunteers fitted 180 stray cattle and dogs with high-visibility reflective collars to prevent nighttime road accidents on state highways.',
      imageUri: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
      sourceName: 'People For Animals',
      contributorsCount: 9,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',
      ],
      location: 'Gwalior Highway Link',
      timestamp: '3 days ago',
      publishedAt: now - 3 * 24 * 3600 * 1000,
      tags: ['vaccination', 'collar', 'highway', 'cattle'],
    },
  ],
  'Support for Persons with Disabilities': [
    {
      id: 'disability_1',
      headline: 'Audiobook Recordings Empower Visually Impaired Students',
      summary: 'Volunteers recorded and formatted 120 textbooks into high-quality audio files, helping students study for competitive board examinations.',
      imageUri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      sourceName: 'NAB India',
      contributorsCount: 15,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80',
      ],
      location: 'Deen Dayal Nagar',
      timestamp: '5 days ago',
      publishedAt: now - 5 * 24 * 3600 * 1000,
      tags: ['audiobook', 'recording', 'students', 'board'],
    },
  ],
  'Elderly Care': [
    {
      id: 'elder_1',
      headline: 'Adopt-A-Grandparent Program Connects Youth and Seniors',
      summary: 'High school students partnered with old age homes, visiting elderly residents weekly to read letters, set up video calls with distant family, and teach mobile apps.',
      imageUri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      sourceName: 'HelpAge India',
      contributorsCount: 20,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80',
      ],
      location: 'Morar Town old age home',
      timestamp: '2 days ago',
      publishedAt: now - 2 * 24 * 3600 * 1000,
      tags: ['grandparent', 'senior', 'youth', 'elderly'],
    },
  ],
  'Water, Sanitation, and Hygiene (WASH)': [
    {
      id: 'wash_1',
      headline: 'Bio-Sand Water Filters Installed in Contaminated Water Zones',
      summary: 'Community members assembled and deployed 70 low-cost bio-sand water filters, significantly reducing waterborne illnesses in a remote farming hamlet.',
      imageUri: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800',
      sourceName: 'WaterAid India',
      contributorsCount: 7,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',
      ],
      location: 'Behat Block, Gwalior',
      timestamp: '4 days ago',
      publishedAt: now - 4 * 24 * 3600 * 1000,
      tags: ['filter', 'water', 'hamlet', 'sanitation'],
    },
  ],
  'Rural Development': [
    {
      id: 'rural_1',
      headline: 'Custom Seed Banks Developed to Safeguard Local Crop Varieties',
      summary: 'Farming cooperatives established a shared seed depository storing drought-resistant millets, reducing dependence on expensive commercial grain markets.',
      imageUri: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
      sourceName: 'NABARD Rural Support',
      contributorsCount: 11,
      contributorsAvatars: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
      ],
      location: 'Pichhore Village Circle',
      timestamp: 'Yesterday',
      publishedAt: now - 22 * 3600 * 1000,
      tags: ['seed', 'millet', 'grain', 'rural'],
    },
  ],
};

class StoryManager {
  private lastReadIndexes: Record<CauseType, number> = {} as any;
  private seenCauses: Record<CauseType, boolean> = {} as any;
  private bookmarkedCauses: Record<CauseType, boolean> = {} as any;
  private lastRefreshTime: number = new Date().getTime();

  constructor() {
    const causes: CauseType[] = [
      'Education', 'Healthcare', 'Child Welfare', 'Poverty Alleviation & Livelihoods',
      'Women Empowerment', 'Disaster Relief', 'Environment & Sustainability', 'Animal Welfare',
      'Support for Persons with Disabilities', 'Elderly Care', 'Water, Sanitation, and Hygiene (WASH)',
      'Rural Development'
    ];
    causes.forEach(c => {
      this.lastReadIndexes[c] = 0;
      this.seenCauses[c] = false;
      this.bookmarkedCauses[c] = false;
    });
  }

  // Local Storage helper for seen stories
  public getSeenStoryIds(): string[] {
    try {
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        const val = localStorage.getItem('seenStoryIds');
        if (val) return JSON.parse(val);
      }
    } catch (e) {}
    return (global as any)['__storage_seenStoryIds'] || [];
  }

  public markStorySeen(storyId: string) {
    const seen = this.getSeenStoryIds();
    if (!seen.includes(storyId)) {
      seen.push(storyId);
      try {
        if (typeof localStorage !== 'undefined' && localStorage !== null) {
          localStorage.setItem('seenStoryIds', JSON.stringify(seen));
        }
      } catch (e) {}
      (global as any)['__storage_seenStoryIds'] = seen;
    }
  }

  // Local Storage helper for tag interest weights
  public getInterestWeights(): Record<string, number> {
    try {
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        const val = localStorage.getItem('interestWeights');
        if (val) return JSON.parse(val);
      }
    } catch (e) {}
    return (global as any)['__storage_interestWeights'] || {};
  }

  public incrementTagWeight(tag: string, amount: number) {
    const weights = this.getInterestWeights();
    const cleanTag = tag.toLowerCase();
    weights[cleanTag] = (weights[cleanTag] || 0) + amount;
    try {
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        localStorage.setItem('interestWeights', JSON.stringify(weights));
      }
    } catch (e) {}
    (global as any)['__storage_interestWeights'] = weights;
  }

  // Weekly interest weights decay
  private checkWeeklyDecay() {
    const currentTime = new Date().getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    let lastDecay = currentTime;

    try {
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        const val = localStorage.getItem('lastInterestDecayTime');
        if (val) lastDecay = parseInt(val);
      }
    } catch (e) {}

    if (currentTime - lastDecay > sevenDaysInMs) {
      const weights = this.getInterestWeights();
      const decayed: Record<string, number> = {};
      Object.keys(weights).forEach(k => {
        decayed[k] = parseFloat((weights[k] * 0.8).toFixed(2));
      });
      try {
        if (typeof localStorage !== 'undefined' && localStorage !== null) {
          localStorage.setItem('interestWeights', JSON.stringify(decayed));
          localStorage.setItem('lastInterestDecayTime', currentTime.toString());
        }
      } catch (e) {}
      (global as any)['__storage_interestWeights'] = decayed;
    }
  }

  // Recompute sorted order of stories for cause
  public getSortedStoriesForCause(cause: CauseType): Story[] {
    this.checkWeeklyDecay();
    const rawStories = MOCK_STORIES_DB[cause] || MOCK_STORIES_DB['Education'];
    
    const seenIds = this.getSeenStoryIds();
    const weights = this.getInterestWeights();

    // Dwell / followed causes: Pinned cause gets priority boost
    const isPinned = (global as any)['__storage_pinnedCause'] === cause;
    const causeBoost = isPinned ? 50 : 0;

    const getStoryInterestScore = (story: Story) => {
      let score = 0;
      story.tags.forEach(t => {
        score += weights[t.toLowerCase()] || 0;
      });
      score += causeBoost;
      return score;
    };

    const unread = rawStories.filter(s => !seenIds.includes(s.id));
    const read = rawStories.filter(s => seenIds.includes(s.id));

    // Sort unread: newest first, boosted by interest weights (1 weight point = 12 hours freshness boost)
    unread.sort((a, b) => {
      const hoursA = a.publishedAt / (1000 * 3600);
      const hoursB = b.publishedAt / (1000 * 3600);
      const scoreA = hoursA + getStoryInterestScore(a) * 12;
      const scoreB = hoursB + getStoryInterestScore(b) * 12;
      return scoreB - scoreA;
    });

    // Sort read: newest first at the end of the list
    read.sort((a, b) => b.publishedAt - a.publishedAt);

    return [...unread, ...read];
  }

  // Legacy fallback method for compatibility
  public getStories(cause: CauseType): Story[] {
    return this.getSortedStoriesForCause(cause);
  }

  public getLastReadIndex(cause: CauseType): number {
    this.checkWeeklyRefresh();
    return this.lastReadIndexes[cause] || 0;
  }

  public saveProgress(cause: CauseType, index: number) {
    const totalStories = this.getStories(cause).length;
    const clampedIndex = Math.min(Math.max(0, index), totalStories - 1);
    this.lastReadIndexes[cause] = clampedIndex;
  }

  public isCauseSeen(cause: CauseType): boolean {
    // A cause is seen if all its stories have been marked seen
    const stories = MOCK_STORIES_DB[cause] || [];
    if (stories.length === 0) return false;
    const seenIds = this.getSeenStoryIds();
    return stories.every(s => seenIds.includes(s.id));
  }

  public markCauseSeen(cause: CauseType, seen: boolean) {
    // If marking cause seen, we mark all its individual stories seen
    if (seen) {
      const stories = MOCK_STORIES_DB[cause] || [];
      stories.forEach(s => this.markStorySeen(s.id));
    }
    this.seenCauses[cause] = seen;
  }

  public isCauseBookmarked(cause: CauseType): boolean {
    return !!this.bookmarkedCauses[cause];
  }

  public toggleCauseBookmarked(cause: CauseType): boolean {
    const current = !!this.bookmarkedCauses[cause];
    this.bookmarkedCauses[cause] = !current;
    return !current;
  }

  private checkWeeklyRefresh() {
    const currentTime = new Date().getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    if (currentTime - this.lastRefreshTime > sevenDaysInMs) {
      (Object.keys(this.lastReadIndexes) as CauseType[]).forEach(c => {
        this.lastReadIndexes[c] = 0;
        this.seenCauses[c] = false;
      });
      // Clear seen stories on weekly refresh
      try {
        if (typeof localStorage !== 'undefined' && localStorage !== null) {
          localStorage.setItem('seenStoryIds', JSON.stringify([]));
        }
      } catch (e) {}
      (global as any)['__storage_seenStoryIds'] = [];
      this.lastRefreshTime = currentTime;
    }
  }

  public forceReset() {
    (Object.keys(this.lastReadIndexes) as CauseType[]).forEach(c => {
      this.lastReadIndexes[c] = 0;
      this.seenCauses[c] = false;
      this.bookmarkedCauses[c] = false;
    });
    try {
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        localStorage.setItem('seenStoryIds', JSON.stringify([]));
      }
    } catch (e) {}
    (global as any)['__storage_seenStoryIds'] = [];
    this.lastRefreshTime = new Date().getTime();
  }
}

export const StoryService = new StoryManager();
