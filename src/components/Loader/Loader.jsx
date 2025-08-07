import "./Loader.scss";

export const Loader = () => {
    return (
        <>
            <div className="app-loading">
                <div className="app-loading-overlay"></div>

                <h2 className="app-loading-text">Loading...</h2>
            </div>
        </>
    )
}