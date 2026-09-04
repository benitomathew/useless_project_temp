import { GameInfo } from '../types';

export const GAMES_DATA: GameInfo[] = [
  {
    id: 'jackfruit',
    titleMalayalam: 'ചക്ക വീണു മുയൽ ചത്തു',
    titleEnglish: 'Chakka Veenu Muyal Chathu',
    transliteration: 'Chakka Veenu Muyal Chathu',
    literalMeaning: 'An accidental fluke / pure blind luck credited as great skill',
    gameGenre: 'Timing & Fluke Physics',
    emoji: '🐇',
    themeColor: 'from-amber-600 to-yellow-500',
    accentColor: '#D97706',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-400',
    shortInstruction: 'Click or Spacebar to drop the heavy jackfruit right on the speeding rabbits!',
    description: 'Rabbits are zooming under the tree. Cut the stem at the exact right microsecond!',
    funnyQuotes: {
      win: [
        'ഭാഗ്യമാണോ കഴിവാണോ അറിയില്ല… പക്ഷേ മുയൽ ചത്തു!',
        'എന്തൊരു ടൈമിംഗ്! മുയലിന് പോലും വിശ്വസിക്കാനായില്ല!',
        'പ്ലാൻ ഒന്നുമില്ലായിരുന്നു… എന്നാലും സംഭവം ഏറ്റു!'
      ],
      lose: [
        'ചക്കയൊന്നും വീണില്ല… മുയൽ രക്ഷപ്പെട്ടോടി!',
        
      ]
    }
  },
  {
    id: 'hole',
    titleMalayalam: 'താൻ കുഴിച്ച കുഴിയിൽ താൻ തന്നെ വീഴും',
    titleEnglish: 'Thaan Kuzhicha Kuzhiyil Thaan Thanne Veezhum',
    transliteration: 'Thaan Kuzhicha Kuzhiyil Thaan Thanne Veezhum',
    literalMeaning: 'Plotting traps for others will inevitably backfire on yourself',
    gameGenre: 'Strategic Trap & Dodge',
    emoji: '🕳️',
    themeColor: 'from-stone-700 to-amber-900',
    accentColor: '#78350F',
    badgeBg: 'bg-stone-200 text-stone-900 border-stone-400',
    shortInstruction: 'Dig holes to trap nosy NPCs, but NEVER step into your own holes!',
    description: 'Place limited hole traps on the path of walking villagers. Don’t fall into your own trap!',
    funnyQuotes: {
      win: [
        'കിടിലൻ കെണി! ഇത്തവണ സ്വന്തം കുഴിയിൽ തന്നെ വീണില്ലല്ലോ!'
      ],
      lose: [
        'മറ്റുള്ളവർക്കായി കുഴി കുഴിച്ചു… അവസാനം അഡ്രസ് മാറി നീ തന്നെ വീണു!'
      ]
    }
  },
  {
    id: 'peruvellam',
    titleMalayalam: 'ചെറുതുള്ളി പെരുവെള്ളം',
    titleEnglish: 'Cheriya Thulli Peruvellam',
    transliteration: 'Cheriya Thulli Peruvellam',
    literalMeaning: 'Little droplets accumulate into a mighty flood',
    gameGenre: 'Bucket Catch & Flood Frenzy',
    emoji: '💧',
    themeColor: 'from-cyan-600 to-blue-600',
    accentColor: '#0284C7',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-400',
    shortInstruction: 'Move your bucket to catch falling water droplets and fill it before the timer expires!',
    description: 'Every drop counts! Move your bucket to catch monsoon droplets, avoid mud splatters, and fill the bucket to 100%!',
    funnyQuotes: {
      win: [
        'ചെറിയ തുള്ളികൾ ചേർന്ന് പെരുവെള്ളമായി!',
        
      ],
      lose: [
        'ഇത്രയും മഴ പെയ്തിട്ടും ബക്കറ്റിൽ ഇത്രയേ ഉള്ളോ? നാണക്കേട്!'
      ]
    }
  }
];
