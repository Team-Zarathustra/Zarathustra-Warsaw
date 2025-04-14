import { Row } from "@tanstack/react-table";
import { RankingInfo, rankItem } from "@tanstack/match-sorter-utils";

export function fuzzyFilter<T>(
    row: Row<T>,
    columnId: string,
    value: string,
    addMeta: (meta: { itemRank: RankingInfo }) => void,
) {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({ itemRank });
    return itemRank.passed;
}