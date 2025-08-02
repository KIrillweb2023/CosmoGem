import "./BoardHome.scss";
import CoinIcon from "../../assets/coin.png"
export const BoardHome = ({ keys, coins }) => {
    return (
        <>
            <div className="app-board">
                <div className="app-board-item">
                    <img src={`${import.meta.env.BASE_URL}/AppIcons/key.png`} alt="key-icon" />
                    <p>{keys}</p>
                </div>
                <div className="app-board-item">
                    <img src={CoinIcon} alt="lampa-icon" />
                    <p>{coins}</p>
                </div>
            </div>
        </>
    )
}