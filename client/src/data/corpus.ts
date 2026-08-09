export interface RagDocument {
  id: string
  title: string
  text: string
}

// Real, current results from 2026 so that I can make a cool real-world example here
// knowledge cutoff (January 2026), so retrieval is doing real work: these are
// facts the model could not have memorized during training.
export const corpus: RagDocument[] = [
  {
    id: 'winter-olympics-2026',
    title: 'Winter Olympics 2026',
    text: `The 2026 Winter Olympics were held in Milano Cortina, Italy, running for 19 days in February. Norway broke its own record for medals at a single Winter Games, finishing with 41 total medals, including a record 18 golds.

The United States finished second overall with 33 medals, ahead of the Netherlands and host nation Italy, who each won 10 golds. Roughly 740 medals were awarded in total across the Games, spanning sports from alpine skiing to figure skating.`,
  },
  {
    id: 'super-bowl-lx',
    title: 'Super Bowl LX',
    text: `Super Bowl LX was played on February 8, 2026, at Levi's Stadium in Santa Clara, California, between the Seattle Seahawks and the New England Patriots. The Seahawks won 29-13, capturing their second Lombardi Trophy in franchise history.

Seattle running back Kenneth Walker was named Super Bowl MVP after rushing for 135 yards on 27 carries. The Seahawks defense forced three turnovers and sacked Patriots quarterback Drake Maye six times, one of the most dominant defensive performances of the season.`,
  },
  {
    id: 'nba-finals-2026',
    title: 'NBA Finals 2026',
    text: `The New York Knicks won the 2026 NBA championship, defeating the San Antonio Spurs four games to one in the Finals. It was the Knicks' first title since 1973, ending one of the longest championship droughts in the league.

Knicks guard Jalen Brunson scored 45 points in the clinching Game 5 and was named Finals MVP, earning the Bill Russell trophy. The series was widely covered as one of the most emotional Finals in recent memory given how long New York had waited for a title.`,
  },
  {
    id: 'world-cup-2026',
    title: '2026 FIFA World Cup',
    text: `The 2026 FIFA World Cup runs from June 11 to July 19, 2026, jointly hosted across sixteen cities in the United States, Mexico, and Canada. It is the first World Cup hosted by three countries and the first held in North America since 1994.

The tournament expanded to 48 teams for the first time, organized into twelve groups of four instead of the previous sixteen groups of three. The top two teams from each group and the best eight third-place finishers advance to a round of 32, making for a longer knockout stage than any previous World Cup.`,
  },
  {
    id: 'wimbledon-2026',
    title: 'Wimbledon 2026',
    text: `At the 2026 Wimbledon Championships, Jannik Sinner defeated Alexander Zverev in a five-set men's singles final, 6-7, 7-6, 6-3, 6-4, to retain his title. It was Sinner's second Wimbledon crown and fifth Grand Slam title overall.

In the women's singles final, Linda Noskova beat fellow Czech player Karolina Muchova 6-2, 5-7, 6-3 to win her first Grand Slam title. The all-Czech final was one of the more surprising results of the 2026 tournament.`,
  },
  {
    id: 'mlb-2026-season',
    title: 'MLB 2026 Season',
    text: `As of early August 2026, the Milwaukee Brewers and Atlanta Braves hold the best records in Major League Baseball, with the Los Angeles Dodgers also among the league's top teams. Atlanta reached 70 wins behind an eight-game winning streak, tying for the largest division lead in baseball.

In the American League, the Yankees, Red Sox, and Rangers currently hold the three wild-card spots. Boston's recent hot streak pulled it up from a season-worst 14 games under .500 to seven games over .500, one of the sharper turnarounds of the season.`,
  },
]
