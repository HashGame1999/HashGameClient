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
import { WalletPageTab } from '../../lib/AppConst'
import { DefaultCoinCode, TxResult, TxType } from '../../lib/RippleConst'
import { dropsToXrp } from 'xrpl'
import TableAsset from '../../components/TableAsset'

export default function TabHistroy() {
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { ConnStatus } = useSelector(state => state.Ripple)
  const { Address } = useSelector(state => state.User)
  const { HistroyTxs, activeTabWallet } = useSelector(state => state.Counter)

  useEffect(() => {
    if (Address !== undefined && Address !== null && activeTabWallet === WalletPageTab.Histroy && ConnStatus) {
      dispatch({ type: 'FetchTxHistroy' })
    }
  }, [dispatch, Address, activeTabWallet, ConnStatus])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'LedgerIndex',
        header: 'Ledger Index',
        cell: ({ row }) => {
          const ledger_index = row.original.LedgerIndex
          const tx_index = row.original.TxIndex
          return (
            <span className='' title={`${ledger_index}#${tx_index}`}>
              {ledger_index}
            </span>
          )
        },
        enableSorting: true
      },
      {
        accessorKey: 'Sequence',
        header: 'Sequence',
        cell: ({ row }) => {
          const sequence = row.original.Sequence
          return (
            <span className=''>
              {sequence}
            </span>
          )
        },
        enableSorting: true
      },
      {
        accessorKey: 'Hash',
        header: 'Hash',
        cell: info => {
          const hash = info.getValue()
          return (
            <span className='font-mono' title={hash}>
              {hash.substring(0, 5)}..
            </span>
          )
        },
      },
      {
        accessorKey: 'TxType',
        header: 'TxType',
        cell: ({ row }) => {
          const tx_type = row.original.TxType
          const tx_result = row.original.TxResult
          return (
            <div className='text-base text-end text-gray-800 dark:text-gray-200'>
              {
                tx_result === TxResult.Success ?
                  <span className={`text-green-500`}>
                    {tx_type}
                  </span>
                  :
                  <span className={`text-yellow-500`} title={tx_result}>
                    {tx_type}
                  </span>
              }

            </div>
          )
        },
      },
      {
        accessorKey: 'SourAccount',
        header: 'SourAccount (Pay)',
        cell: ({ row }) => {
          const tx_type = row.original.TxType
          const tx_result = row.original.TxResult
          const sour_account = row.original.SourAccount
          const pay = row.original.json.tx_json.TakerGets
          return (
            <div className='text-base text-center'>
              {tx_type === TxType.Payment && tx_result === TxResult.Success &&
                (
                  sour_account === Address ?
                    <span className='font-bold font-mono text-green-500' title={sour_account}>
                      You
                    </span>
                    :
                    <span className='font-bold font-mono' title={sour_account}>
                      {sour_account?.slice(0, 9)}...{sour_account?.slice(-5)}
                    </span>
                )
              }
              {tx_type === TxType.OfferCreate && tx_result === TxResult.Success &&
                <TableAsset asset={pay} />
              }
            </div>
          )
        },
      },
      {
        accessorKey: 'DestAccount',
        header: 'DestAccount (Get)',
        cell: ({ row }) => {
          const tx_type = row.original.TxType
          const tx_result = row.original.TxResult
          const dest_account = row.original.DestAccount
          const get = row.original.json.tx_json.TakerPays
          return (
            <div className='text-base text-center'>
              {tx_type === TxType.Payment && tx_result === TxResult.Success &&
                (
                  dest_account === Address ?
                    <span className='font-bold font-mono text-green-500' title={dest_account}>
                      You
                    </span>
                    :
                    <span className='font-bold font-mono' title={dest_account}>
                      {dest_account?.slice(0, 9)}...{dest_account?.slice(-5)}
                    </span>
                )
              }
              {tx_type === TxType.OfferCreate && tx_result === TxResult.Success &&
                <TableAsset asset={get} />
              }
            </div>
          )
        },
      },
      {
        accessorKey: 'DeliveredAmount',
        header: 'Amount (OfferSequence) (TrustLine)',
        cell: ({ row }) => {
          const tx_type = row.original.TxType
          const tx_result = row.original.TxResult
          const currency = row.original.Currency
          const issuer = row.original.Issuer
          const delivered_amount = row.original.DeliveredAmount
          const offer_sequence = row.original.json.tx_json.OfferSequence
          const asset = row.original.json.tx_json.LimitAmount
          return (
            <div className='text-base text-end'>
              {tx_type === TxType.Payment && tx_result === TxResult.Success &&
                (
                  currency === DefaultCoinCode ?
                    <span>
                      <span className='font-bold'>
                        {dropsToXrp(delivered_amount)}
                      </span>
                      <span className={'text-green-500'}>
                        {DefaultCoinCode}
                      </span>
                    </span>
                    :
                    <span title={`${issuer}.${currency}`}>
                      <span className='font-bold'>
                        {delivered_amount}
                      </span>
                      <span className={'text-yellow-500'}>
                        {currency}
                      </span>
                    </span>
                )
              }
              {tx_type === TxType.OfferCancel && tx_result === TxResult.Success &&
                <span className={'font-bold'}>
                  Offer#{offer_sequence}
                </span>
              }
              {tx_type === TxType.TrustSet && tx_result === TxResult.Success &&
                <TableAsset asset={asset} />
              }
            </div>
          )
        },
      },
      {
        accessorKey: 'close_time_iso',
        header: 'Time',
        cell: ({ row }) => {
          const memo = row.original.Memo
          const close_time_iso = row.original.close_time_iso
          return (
            <span title={`${memo !== undefined ? memo : ''}`} className={`${memo !== undefined ? 'text-yellow-500' : ''}`}>
              {close_time_iso}
            </span>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: HistroyTxs || [],
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
          <table className="min-w-full border border-gray-200 dark:border-gray-700">
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
            <tbody className="border border-gray-200 dark:border-gray-700">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border border-gray-200 dark:border-gray-700 hover:bg-gray-500">
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
            className="border rounded p-1 bg-gray-300 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
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