import "./ScoreGame.scss";

import KeyGameValute from "../../assets/key.png";

export const ScoreGame = ({ score, keys }) => {
    return (
        <>
            <div className="app-game-score">
                <div className="app-game-wrapper">
                    <div className="app-game-count">
                        <p className="app-game-count_text">Score:</p>
                        <span className="app-game-count_record">{score}</span>
                    </div>
                    <div className="app-game-keys">
                        <img className="app-game-keys_icon" src={KeyGameValute} alt="key-icon" />
                        <span className="app-game-keys_count">{keys}</span>
                    </div>
                </div>
            </div>
        </>
    )
}