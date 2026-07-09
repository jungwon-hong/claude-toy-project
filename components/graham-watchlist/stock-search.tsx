"use client";

import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import kospi200 from "@/public/data/kospi200.json";
import type { StockMasterEntry } from "@/types/stock";

const master = kospi200 as StockMasterEntry[];

interface StockSearchProps {
  onSelect: (stock: StockMasterEntry) => void;
}

export function StockSearch({ onSelect }: StockSearchProps) {
  const [value, setValue] = useState<StockMasterEntry | null>(null);
  const [inputValue, setInputValue] = useState("");

  return (
    <Combobox
      items={master}
      itemToStringLabel={(item: StockMasterEntry) => item.name}
      limit={5}
      value={value}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      onValueChange={(item: StockMasterEntry | null) => {
        if (item) {
          onSelect(item);
          setValue(null);
          setInputValue("");
        }
      }}
    >
      <ComboboxInput placeholder="종목명 입력 (코스피200)" />
      <ComboboxContent>
        <ComboboxEmpty>코스피200 내에서 일치하는 종목이 없습니다</ComboboxEmpty>
        <ComboboxList>
          {(item: StockMasterEntry) => (
            <ComboboxItem key={item.code} value={item}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
