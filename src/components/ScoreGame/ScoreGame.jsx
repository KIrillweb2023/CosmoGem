import "./ScoreGame.scss";

import CoinValute from "../../assets/coin.png";

export const ScoreGame = ({ score, keys }) => {
    return (
        <>
            <div className="app-game-score">
                <div className="app-game-wrapper">
                    <div className="app-game-count">
                        <img src={CoinValute} className="app-game-count_icon" />
                        <span className="app-game-count_record">{score}</span>
                    </div>
                    <div className="app-game-keys">
                        <img className="app-game-keys_icon" src={`${import.meta.env.BASE_URL}/AppIcons/key.png`} alt="key-icon" />
                        <span className="app-game-keys_count">{keys}</span>
                    </div>
                </div>
            </div>
        </>
    )
}