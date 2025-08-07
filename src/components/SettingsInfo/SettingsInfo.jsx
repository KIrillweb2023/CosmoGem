import "./SettingsInfo.scss";

export const SettingsInfo = () => {
    return (
        <>
            <div className="app-settings-info">
                <div className="app-settings-info_item">
                    <input type="text" className="app-settings-info_item__name" placeholder="Player-23we52rr" />
                    <span className="app-settings-info_item__count">10/15</span>
                </div>
            </div>
        </>
    )
}