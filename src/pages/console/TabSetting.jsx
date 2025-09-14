import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import InternalButton from '../../components/InternalButton'
import { ConsolePageTab } from '../../lib/AppConst'
import { setDisplayJson } from '../../store/slices/UserSlice'

export default function TabSetting() {
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15
  })

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { ConnStatus } = useSelector(state => state.Ripple)
  const { GameSettingList, activeTabConsole } = useSelector(state => state.Dealer)

  useEffect(() => {
    if (activeTabConsole === ConsolePageTab.Setting && ConnStatus) {
      dispatch({ type: 'FetchGameSetting' })
    }
  }, [dispatch, activeTabConsole, ConnStatus])

  const columns = [
    {
      accessorKey: 'OpenLedgerIndex',
      header: 'Open Ledger Index',
      cell: info => {
        const open_ledger_index = info.getValue()
        return (
          <div className='flex justify-center text-base text-center text-gray-800 dark:text-gray-200'>
            {open_ledger_index}
          </div>
        )
      },
      enableSorting: true
    },
    {
      accessorKey: 'CloseLedgerIndex',
      header: 'Close Ledger Index',
      cell: info => {
        const close_ledger_index = info.getValue()
        return (
          <div className='text-base text-center text-gray-800 dark:text-gray-200'>
            <span>
              {close_ledger_index}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'DrawLedgerInterval',
      header: 'Draw Ledger Interval',
      cell: info => {
        const index = info.getValue()
        return (
          <div className='text-base text-center text-gray-800 dark:text-gray-200'>
            <span>
              {index}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'GameAccount',
      header: 'Draw Size',
      cell: ({ row }) => {
        return (
          <div className='text-base text-center text-gray-800 dark:text-gray-200'>
            <span>
              {(row.original.CloseLedgerIndex - row.original.OpenLedgerIndex + 1) / row.original.DrawLedgerInterval}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'JackpotCodeLength',
      header: 'Jackpot Code Length',
      cell: info => {
        const jackpot_code_length = info.getValue()
        return (
          <div className='text-base text-center text-gray-800 dark:text-gray-200'>
            <span>
              {jackpot_code_length}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'Version',
      header: 'Version',
      cell: info => {
        const version = info.getValue()
        return (
          <div className='text-base text-center text-gray-800 dark:text-gray-200'>
            <span>
              {version}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'Index',
      header: 'Index',
      cell: info => {
        const index = info.getValue()
        return (
          <div className='text-base text-center text-gray-800 dark:text-gray-200'>
            <span>
              {index}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: '',
      header: 'Action',
      cell: ({ row }) => {
        return (
          <div className='flex justify-center text-base text-center text-gray-800 dark:text-gray-200'>
            <InternalButton title={`Use`} onClick={() => {
              dispatch({ type: 'UseGameSetting', payload: { open_ledger_index: row.original.OpenLedgerIndex } })
              navigate(`/`)
            }} text_size={"text-base"} />
            <InternalButton title={`Detail`} onClick={() => { dispatch(setDisplayJson({ json: row.original, isExpand: true })) }} text_size={"text-base"} />
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: GameSettingList || [],
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
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: false,
  })

  return (
    <div className="p-1">
      <div className={`mx-auto flex flex-col justify-evenly`}>
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="p-2 text-center font-bold text-base text-gray-800 dark:text-gray-300 tracking-wider"
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