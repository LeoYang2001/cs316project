import React, { useState, useEffect } from 'react';

import { Container, Header, Button, Card, Image, Grid, Segment } from 'semantic-ui-react';
import './App.css';

const App = () => {
  const [deckId, setDeckId] = useState(null);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [playerWins, setPlayerWins] = useState(0);
  const [dealerWins, setDealerWins] = useState(0);
  const [cardsRemaining, setCardsRemaining] = useState(52);
  const [acesRemaining, setAcesRemaining] = useState(4);
  const [tensRemaining, setTensRemaining] = useState(16);
  const [push, setPush] = useState(0);
  const [ifRevealDealer, setIfRevealDealer] = useState(false);
  const [hasCheckedWinner, setHasCheckedWinner] = useState(false)

  useEffect(() => {
    const getNewDeck = async () => {
      const response = await fetch('https://cards.soward.net/deck/newDeck');
      const data = await response.json();
      setDeckId(data.deckID);
      setCardsRemaining(data.cardsRemaining);
    };
    getNewDeck();
  }, []);

  useEffect(() => {
    updateDeckStatus();
  }, [playerHand, dealerHand]);

  const calculateScore = (hand) => {
    let score = 0;
    let aces = 0;

    hand.forEach((card) => {
      if (card.intValue === 11 || card.intValue === 12 || card.intValue === 13) {
        score += 10;
      } else if (card.intValue === 1) {
        aces += 1;
        score += 11;
      } else {
        score += card.intValue;
      }
    });

    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }

    return score;
  };

  const drawCards = async (count) => {
    const res = await fetch(`https://cards.soward.net/deck/deckStatus/${deckId}`);
    const cardData = await res.json();
    const cardsRemained = cardData.cardsRemaining
    if (cardsRemained < count) {
      alert('Not enough cards to deal. Shuffling the deck');
      return []
    }
    else{
      const response = await fetch(`https://cards.soward.net/deck/drawFromDeck/${deckId}/${count}`);
      const data = await response.json();
      
      const cards = data.cards
      let newTensRemaining = tensRemaining
      let newAcesRemaining = acesRemaining
      for(let card of cards){
        if(card.intValue >= 10)
        {
          newTensRemaining--;
        }
        if(card.value === 'ace')
        {
          newAcesRemaining--;
        }
      }
      setTensRemaining(newTensRemaining)
      setAcesRemaining(newAcesRemaining)
      return data.cards;
    }
  };

  const shuffleDeck = async () => {
    const response = await fetch(`https://cards.soward.net/deck/shuffleDeck/${deckId}`);
    const data = await response.json();
    setCardsRemaining(data.cardsRemaining);
  };

  const updateDeckStatus = async () => {
    const response = await fetch(`https://cards.soward.net/deck/deckStatus/${deckId}`);
    const data = await response.json();
    setCardsRemaining(data.cardsRemaining);
  };

  const startNewGame = async () => {
    shuffleDeck()
    setHasCheckedWinner(false)
    setIfRevealDealer(false);
    setAcesRemaining(4);
    setTensRemaining(16);
    setPlayerHand([]);
    setDealerHand([]);
    const cards = await drawCards(4);
   
    
    setPlayerHand([cards[0], cards[1]]);
    setDealerHand([cards[2], cards[3]]);
    setPlayerScore(calculateScore([cards[0], cards[1]]));
    setDealerScore(calculateScore([cards[2], cards[3]]));
    
  };

  const newDeal = async () => {
    setHasCheckedWinner(false)
    setIfRevealDealer(false);
    setPlayerHand([]);
    setDealerHand([]);
    const cards = await drawCards(4);
    if(cards.length == 0) {
      shuffleDeck()
      return
    }


    setPlayerHand([cards[0], cards[1]]);
    setDealerHand([cards[2], cards[3]]);
    setPlayerScore(calculateScore([cards[0], cards[1]]));
    setDealerScore(calculateScore([cards[2], cards[3]]));
  };

  const hit = async () => {
    const cards = await drawCards(1);
    const newHand = [...playerHand, cards[0]];
    setPlayerHand(newHand);
    setPlayerScore(calculateScore(newHand));
    if (calculateScore(newHand) > 21) {
      setTimeout(() => {
        alert('Player Busts! Dealer Wins!');
      }, 500);
    }
  };

  const checkForWinner = async () => {
    setIfRevealDealer(true);
    setDealerHand([dealerHand[0], dealerHand[1]]);

    let hand = dealerHand;
    let score = dealerScore;
    while (score < 17 && score < playerScore) {
      const cards = await drawCards(1);
      hand = [...hand, cards[0]];
      score = calculateScore(hand);
      setDealerHand(hand);
    }

    setDealerScore(score);
    setHasCheckedWinner(true)

    setTimeout(() => {
      announceResult(score);
    }, 500);

  };

  const announceResult = (score) => {
    if (playerScore > 21) {
      alert('Player Busts! Dealer Wins!');
      setDealerWins(dealerWins + 1);
    } else if (score > 21) {
      alert('Dealer Busts! Player Wins!');
      setPlayerWins(playerWins + 1);
    } else if (playerScore > score) {
      alert('Player Wins!');
      setPlayerWins(playerWins + 1);
    } else if (score > playerScore) {
      alert('Dealer Wins!');
      setDealerWins(dealerWins + 1);
    } else {
      alert('It\'s a Tie!');
      setPush(push + 1);
    }
  };

  const resetStats = () => {
    setPlayerWins(0);
    setDealerWins(0);
    setPlayerScore(0);
    setDealerScore(0);
    setPush(0);
  };

  return (
    <Container textAlign="center">
      <Header as="h1">Blackjack</Header>
      {deckId ? (
        <Segment>
        

          <Grid columns={1} divided textAlign="center">
          <Grid.Column>
            <div style={{ marginBottom: "2rem" }}>
              <Grid.Row>
                <Header as="h3">Dealer's Hand</Header>
                <Segment basic>
                  <Card.Group centered>
                    {dealerHand.map((card, index) =>
                     {
                     
                      return (
                        index === dealerHand.length - 1 && !ifRevealDealer ? (
                          <Image src="https://cards.soward.net/images/backs/blue2.svg" />
                        ) : (
                          <Image key={`${card.intValue} - ${index}`} src={card.pngImage} alt={card.value} />
                        )
                      )
                     }
                    )}
                  </Card.Group>
                </Segment>
                {
                  ifRevealDealer && (
                    <p>Score: {dealerScore}</p>
                  )
                }
              </Grid.Row>
            </div>
            <div style={{ marginBottom: "2rem" }}>
              <Grid.Row>
                <Header as="h2">Player's Hand</Header>
                <Segment basic>
                  <Card.Group centered>
                    {playerHand.map((card, index) => {
                      
                      return (
                        <Image key={`${card.intValue} - ${index}`} src={card.pngImage} alt={card.value} />
                      )
                    })}
                  </Card.Group>
                </Segment>
                <p>Score: {playerScore}</p>
              </Grid.Row>
            </div>
          </Grid.Column>
        </Grid>

        <Button.Group>
  <Button primary onClick={startNewGame}>
    Start New Game
  </Button>
  <Button secondary onClick={newDeal}>
    New Deal
  </Button>
  <Button 
    onClick={hit} 
    disabled={cardsRemaining === 0 || playerHand.length === 0 || hasCheckedWinner}
  >
    Hit
  </Button>
  <Button 
    color="orange" 
    onClick={checkForWinner} 
    disabled={playerHand.length === 0 || hasCheckedWinner}
  >
    Stand
  </Button>
  <Button color="red" onClick={resetStats}>
    Reset Stats
  </Button>
</Button.Group>


          <Segment>
            <p>Player Wins: {playerWins}</p>
            <p>Dealer Wins: {dealerWins}</p>
            <p>Push: {push}</p>
          </Segment>

          <Segment>
            <p>Deck ID: {deckId}</p>
            <p>Cards Remaining: {cardsRemaining}</p>
            <p>Aces Remaining: {acesRemaining}</p>
            <p>Tens Remaining: {tensRemaining}</p>
          </Segment>
        </Segment>
      ) : (
        <p>Loading deck...</p>
      )}
    </Container>
  );
};

export default App;
