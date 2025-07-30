import "./TextGame.scss";

export const TextGame = () => {
    return (
        <div className="app-descr">
            <div className="app-descr-wrapper">
                <h2 className="app-descr-title">PointGem</h2>
                <p className="app-descr-text">
                    Собирай космические кристаллы и соревнуйся с друзьями!
                    Каждое сокровище делает тебя ближе к званию Галактического Коллекционера.
                </p>

                <div className="app-descr-block">
                    <div className="app-descr-pulse"></div>
                    <span className="app-descr-number">1,247</span>
                    <span className="app-descr-label">в игре</span>
                </div>
            </div>
        </div>
    )
}