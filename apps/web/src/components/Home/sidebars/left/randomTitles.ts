export const friendsTitles = [
	"Companions",
	"Squad",
	"Crew",
	"Circle",
	"Allies",
	"Network",
	"Tribe",
	"Fellowship",
	"Collective",
	"Ensemble",
	"Clan",
	"Team",
	"Cohort",
	"Posse",
	"League",
] as const;

export const getRandomTitle = (): string =>
	friendsTitles[Math.floor(Math.random() * friendsTitles.length)] || "Friends";
