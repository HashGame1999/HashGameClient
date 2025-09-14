import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { LoadDrawListStart } from '../store/slices/DealerSlice'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import TableJackpotCode from '../components/TableJackpotCode'
import InternalButton from '../components/InternalButton'

export default function HistroyPage() {
  const [drawList, setDrawList] = useState([])
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { DrawList } = useSelector(state => state.Dealer)

  useEffect(() => {
    dispatch(LoadDrawListStart())
  }, [dispatch])

  useEffect(() => {
    setDrawList(DrawList)
  }, [DrawList])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'OpenLedgerIndex',
        header: 'Open Ledger Index',
        cell: info => {
          const open_ledger_index = info.getValue()
          return (
            <InternalButton title={open_ledger_index} onClick={() => navigate(`/draw/${open_ledger_index}`)} text_size={"text-base"} />
          )
        },
        enableSorting: true
      },
      {
        accessorKey: 'CloseLedgerIndex',
        header: 'Close Ledger Index',
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'JackpotCode',
        header: 'Jackpot Code',
        cell: info => {
          const jackpot_code = info.getValue()
          return (
            <TableJackpotCode jackpot_code={jackpot_code} />
          )
        },
      },
      {
        accessorKey: 'InitPool',
        header: 'Init Pool',
        cell: info => {
          const init_poolinit_pool = info.getValue().toLocaleString()
          return (
            <div className='text-base text-end text-gray-800 dark:text-gray-200'>
              <span>
                {init_poolinit_pool}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'Income',
        header: 'Codes',
        cell: info => {
          const income = info.getValue().toLocaleString()
          return (
            <div className='text-base text-end text-gray-800 dark:text-gray-200'>
              <span>
                {income}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'OperatingFee',
        header: 'Fee',
        cell: info => {
          const operating_fee = info.getValue().toLocaleString()
          return (
            <div className='text-base text-end text-gray-800 dark:text-gray-200'>
              <span>
                {operating_fee}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'JackpotAmount',
        header: 'Jackpot Amount (Count)',
        cell: ({ row }) => {
          const jackpot_count = row.original.JackpotCount
          const jackpot_amount = row.getValue('JackpotAmount').toLocaleString()

          return (
            <div className='text-base text-end text-gray-800 dark:text-gray-200'>
              {
                jackpot_count > 0 ?
                  <span className="font-bold text-yellow-600 dark:text-yellow-300">
                    {jackpot_amount}({jackpot_count})
                  </span>
                  :
                  <span>
                    {jackpot_amount}({jackpot_count})
                  </span>
              }
            </div>
          )
        },
        enableSorting: true
      },
      {
        accessorKey: 'BreakdownCount',
        header: 'Breakdown Count',
        cell: info => {
          const breakdown_count = info.getValue()
          return (
            <div className='text-base text-end text-gray-800 dark:text-gray-200'>
              {
                breakdown_count > 0 ?
                  <span className="font-bold text-yellow-600 dark:text-yellow-300">
                    {breakdown_count}
                  </span>
                  :
                  <span>
                    {breakdown_count}
                  </span>
              }
            </div>
          )
        },
        enableSorting: true
      },
      {
        accessorKey: 'AmountTotal',
        header: 'Paid Amount',
        cell: ({ row }) => {
          const jackpot_count = row.original.JackpotCount
          const amount_total = row.getValue('AmountTotal')

          return (
            <div className='text-base text-end text-gray-800 dark:text-gray-200'>
              {
                jackpot_count > 0 ?
                  <span className="p-1 rounded-full bg-indigo-500 font-bold text-yellow-300">
                    {amount_total.toLocaleString()}
                  </span>
                  :
                  <span>
                    {amount_total.toLocaleString()}
                  </span>
              }
            </div>
          )
        },
        enableSorting: true
      },
      {
        accessorKey: 'PaidRate',
        header: 'Paid Rate',
        cell: info => {
          const paid_rate = info.getValue()
          return (
            <div className='text-base text-end text-gray-800 dark:text-gray-200'>
              <span>
                {paid_rate}%
              </span>
            </div>
          )
        },
        enableSorting: true
      }
    ],
    []
  )

  const table = useReactTable({
    data: drawList || [],
    columns,
    state: {
      sorting,
      pagination
    },
    onSortingChange: sorting => {
      setSorting(sorting)
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
    },
    onPaginationChange: setPagination,
    autoResetPageIndex: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: false,
  })

  return (
    <div className="p-1">
      <div className={`mx-auto flex flex-col justify-evenly mt-8`}>
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="p-2 text-center font-bold text-xs text-gray-800 dark:text-gray-300 tracking-wider"
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-500">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-2 whitespace-nowrap text-base text-gray-800 dark:text-gray-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50 text-base text-gray-800 dark:text-gray-200"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {'<<'}
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50 text-base text-gray-800 dark:text-gray-200"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {'<'}
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50 text-base text-gray-800 dark:text-gray-200"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {'>'}
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50 text-base text-gray-800 dark:text-gray-200"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {'>>'}
            </button>
          </div>

          <span className="flex items-center gap-1 text-base text-gray-800 dark:text-gray-200">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </strong>
          </span>

          <select
            className="border rounded p-1"
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[15, 25, 50, 100].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}