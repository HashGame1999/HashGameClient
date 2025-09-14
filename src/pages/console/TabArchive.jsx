import { useState, useEffect, useMemo } from 'react'
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
import { ConsolePageTab } from '../../lib/AppConst'
import { loadArchiveStart } from '../../store/slices/DealerSlice'
import TableJackpotCode from '../../components/TableJackpotCode'
import InternalButton from '../../components/InternalButton'
import ArchiveTicketCode from '../../components/ArchiveTicketCode'

const TabArchive = ({ icon, label, onClick }) => {
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { ConnStatus } = useSelector(state => state.Ripple)
  const { Address } = useSelector(state => state.User)
  const { Archive, activeTabConsole } = useSelector(state => state.Dealer)

  useEffect(() => {
    if (Address !== undefined && Address !== null && activeTabConsole === ConsolePageTab.Archive && ConnStatus) {
      dispatch(loadArchiveStart())
    }
  }, [dispatch, Address, activeTabConsole, ConnStatus])

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
        accessorKey: 'Tickets',
        header: 'Tickets',
        size: 3000,
        cell: ({ row }) => {
          const jackpot_code = row.original.JackpotCode
          const tickets = row.getValue('Tickets')
          return (
            <div className="justify-between flex flex-col">
              {tickets.map((ticket, index) => (
                <div key={index} className='text-xs text-gray-200 mt-1 p-1'>
                  <ArchiveTicketCode codes={ticket.Codes} jackpot_code={jackpot_code} />
                </div>
              ))}
            </div>
          )
        },
      }
    ],
    []
  )

  const table = useReactTable({
    data: Archive || [],
    columns,
    defaultColumn: {
      size: 150,
      minSize: 80,
      maxSize: 3000
    },
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

export default TabArchive