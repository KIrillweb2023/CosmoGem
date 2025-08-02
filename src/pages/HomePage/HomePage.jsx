import { ActionButtons } from "../../components/ActionButtons/ActionButtons"
import { BoardHome } from "../../components/BoardHome/BoardHome"
import { TextGame } from "../../components/TextGame/TextGame"

export const HomePage = () => {
    return (
        <>
            <BoardHome keys={0} coins={0} />
            <TextGame />
            <ActionButtons />
        </>
    )
}