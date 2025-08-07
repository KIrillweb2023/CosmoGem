import "./SettingsStats.scss";

export const SettingsStats = () => {
    return (
        <>
            <div className="app-settings-stats">
                <div className="app-settings-title">
                    Статистика по выбитым гемам
                </div>
                <div className="app-settings-stats_item">
                    <img src={`${import.meta.env.BASE_URL}/GemsIcon/ruby-gem.png`} alt="icon-gem" className="app-settings-stats_item__icon" />
                    <div className="app-settings-stats_item__text">
                        <div className="_block">
                            <span className="_name">Rubin</span>
                            <p className="_count">23433</p>
                        </div>
                        <div className="_state">
                            <div className="_state-child"></div>
                        </div>
                    </div>

                </div>
                <div className="app-settings-stats_item">
                    <img src={`${import.meta.env.BASE_URL}/GemsIcon/amethyst-gem.png`} alt="icon-gem" className="app-settings-stats_item__icon" />
                    <div className="app-settings-stats_item__text">
                        <div className="_block">
                            <span className="_name">Amethyst</span>
                            <p className="_count">2533</p>
                        </div>
                        <div className="_state">
                            <div className="_state-child"></div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}