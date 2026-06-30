import type { PackingList, PackingListItem, DefaultPackingItem } from "@prisma/client";

export type PackingListWithItems = PackingList & {
  items: PackingListItem[];
};

export type GroupedItems = Record<string, PackingListItem[]>;

export type DefaultItemWithCategory = DefaultPackingItem;

export type { PackingList, PackingListItem, DefaultPackingItem };
