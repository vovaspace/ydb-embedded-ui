import {Skeleton} from '@gravity-ui/uikit';

import {DEFAULT_ALIGN} from './constants';
import {b} from './shared';
import type {AlignType, Column, GetRowClassName} from './types';

interface TableCellProps {
    height: number;
    width: number;
    align?: AlignType;
    children: React.ReactNode;
    className?: string;
}

const TableRowCell = ({
    children,
    className,
    height,
    width,
    align = DEFAULT_ALIGN,
}: TableCellProps) => {
    // Additional maxWidth to ensure overflow hidden for <td>
    return (
        <td
            className={b('row-cell', {align: align}, className)}
            style={{height: `${height}px`, width: `${width}px`, maxWidth: `${width}px`}}
        >
            {children}
        </td>
    );
};

interface LoadingTableRowProps<T> {
    columns: Column<T>[];
    index: number;
    height: number;
}

export const LoadingTableRow = <T,>({index, columns, height}: LoadingTableRowProps<T>) => {
    return (
        <tr className={b('row')}>
            {columns.map((column) => {
                return (
                    <TableRowCell
                        key={`${column.name}${index}`}
                        height={height}
                        width={column.width}
                        align={column.align}
                        className={column.className}
                    >
                        <Skeleton style={{width: '80%', height: '50%'}} />
                    </TableRowCell>
                );
            })}
        </tr>
    );
};

interface TableRowProps<T> {
    columns: Column<T>[];
    index: number;
    row: T;
    height: number;
    getRowClassName?: GetRowClassName<T>;
}

export const TableRow = <T,>({row, index, columns, getRowClassName, height}: TableRowProps<T>) => {
    const additionalClassName = getRowClassName?.(row);

    return (
        <tr className={b('row', additionalClassName)}>
            {columns.map((column) => {
                return (
                    <TableRowCell
                        key={`${column.name}${index}`}
                        height={height}
                        width={column.width}
                        align={column.align}
                        className={column.className}
                    >
                        {column.render({row, index})}
                    </TableRowCell>
                );
            })}
        </tr>
    );
};

interface EmptyTableRowProps<T> {
    columns: Column<T>[];
    children?: React.ReactNode;
}

export const EmptyTableRow = <T,>({columns, children}: EmptyTableRowProps<T>) => {
    return (
        <tr className={b('row', {empty: true})}>
            <td colSpan={columns.length} className={b('td')}>
                {children}
            </td>
        </tr>
    );
};
