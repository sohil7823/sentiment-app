export const MAX_CHARS = 1000;

export const META = {
  negative: { label: "Negative", color: "var(--neg)", soft: "var(--neg-soft)" },
  neutral: { label: "Neutral", color: "var(--neu)", soft: "var(--neu-soft)" },
  positive: { label: "Positive", color: "var(--pos)", soft: "var(--pos-soft)" },
};
export const CLASSES = ["negative", "neutral", "positive"];

export const EXAMPLES = [
  "@united my flight was delayed 5 hours and nobody helped!!",
  "@JetBlue thank you for the amazing service, best crew ever!",
  "@Delta what is the baggage policy for international flights?",
  "@AmericanAir great, another delay. Love sitting on the tarmac for 2 hours.",
  "@SouthwestAir the flight was not on time and the staff was not helpful",
];

// 16 calm tweets followed by 16 complaints: used by the "demo stream" on the dashboard.
export const DEMO_TWEETS = [
  "@JetBlue thanks for the smooth flight today, the crew was lovely!",
  "@Delta what time does the check-in counter open at JFK?",
  "@SouthwestAir great seats and friendly staff, will fly again",
  "@AmericanAir can I add a bag to my booking online?",
  "@united the new app update is really helpful, thank you",
  "@VirginAmerica loved the new planes, best flight in a long time",
  "@USAirways do you fly direct from Boston to Phoenix?",
  "@JetBlue quick boarding and on time arrival, awesome job",
  "@Delta does my ticket include a free carry on?",
  "@SouthwestAir thank you for the quick help at the gate",
  "@AmericanAir how early should I arrive for an international flight?",
  "@united smooth check in and kind agent at the desk, appreciate it",
  "@JetBlue is there wifi on the flight to Orlando?",
  "@Delta amazing service from the flight attendants today",
  "@USAirways what is the baggage allowance for economy?",
  "@VirginAmerica thanks for the upgrade, made my day",
  "@united my flight has been delayed for 4 hours and nobody tells us anything",
  "@AmericanAir lost my luggage again, worst service ever",
  "@USAirways cancelled my flight and customer service will not pick up the phone",
  "@Delta stuck on the tarmac for 2 hours with no information, terrible",
  "@SouthwestAir still waiting for my refund after three weeks, unacceptable",
  "@JetBlue the delay made me miss my connection and nobody helped",
  "@united rude staff at the gate and no apology for the late flight",
  "@AmericanAir been on hold for 90 minutes, this is ridiculous",
  "@USAirways my bag arrived damaged and they refuse to take responsibility",
  "@Delta flight cancelled with no rebooking options, very disappointed",
  "@united never flying with you again after this mess",
  "@SouthwestAir overbooked flight and they bumped me with no compensation",
  "@JetBlue another hour of delay, the worst airline experience",
  "@AmericanAir the crew was unhelpful and my seat was broken",
  "@USAirways three delays in one day, please fix this",
  "@Delta lost my baggage and the support chat is useless",
];
