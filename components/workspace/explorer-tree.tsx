"use client";

import Link from "next/link";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ChevronDown, ChevronRight, FolderOpen, FolderTree, KanbanSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FolderNode = {
  id: string;
  name: string;
  parentFolderId: string | null;
};

type AssetNode = {
  id: string;
  name: string;
  key?: string;
  folderId: string | null;
  status?: string;
  taskCount?: number;
  openTaskCount?: number;
};

export function ExplorerTree({
  title,
  basePath,
  folders,
  assets,
  selectedFolderId,
  selectedAssetId,
}: {
  title: string;
  basePath: string;
  folders: FolderNode[];
  assets: AssetNode[];
  selectedFolderId?: string | null;
  selectedAssetId?: string | null;
}) {
  const expandedDefaults = useMemo(
    () => new Set(getExpandedFolderIds(folders, assets, selectedFolderId, selectedAssetId)),
    [assets, folders, selectedAssetId, selectedFolderId],
  );
  const [expandedFolders, setExpandedFolders] = useState(expandedDefaults);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Explorer</p>
          <h2 className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
        </div>
        <Badge variant="neutral">{assets.length} projects</Badge>
      </div>

      <div className="space-y-1">
        <FolderBranch
          assets={assets}
          basePath={basePath}
          expandedFolders={expandedFolders}
          folders={folders}
          level={0}
          parentFolderId={null}
          selectedAssetId={selectedAssetId}
          selectedFolderId={selectedFolderId}
          setExpandedFolders={setExpandedFolders}
        />
      </div>
    </div>
  );
}

function FolderBranch({
  folders,
  assets,
  parentFolderId,
  level,
  expandedFolders,
  setExpandedFolders,
  selectedFolderId,
  selectedAssetId,
  basePath,
}: {
  folders: FolderNode[];
  assets: AssetNode[];
  parentFolderId: string | null;
  level: number;
  expandedFolders: Set<string>;
  setExpandedFolders: Dispatch<SetStateAction<Set<string>>>;
  selectedFolderId?: string | null;
  selectedAssetId?: string | null;
  basePath: string;
}) {
  const childFolders = folders.filter((folder) => folder.parentFolderId === parentFolderId);
  const childAssets = assets.filter((asset) => asset.folderId === parentFolderId);

  return (
    <>
      {childFolders.map((folder) => {
        const isExpanded = expandedFolders.has(folder.id);
        const hasChildren =
          folders.some((child) => child.parentFolderId === folder.id) ||
          assets.some((asset) => asset.folderId === folder.id);

        return (
          <div key={folder.id}>
            <div className="flex items-center gap-1">
              <button
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                onClick={() => {
                  setExpandedFolders((current) => {
                    const next = new Set(current);

                    if (next.has(folder.id)) {
                      next.delete(folder.id);
                    } else {
                      next.add(folder.id);
                    }

                    return next;
                  });
                }}
                type="button"
              >
                {hasChildren ? (
                  isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                ) : (
                  <span className="h-4 w-4" />
                )}
              </button>

              <Link
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-sm transition",
                  selectedFolderId === folder.id
                    ? "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                )}
                href={`${basePath}?folder=${folder.id}`}
                style={{ paddingLeft: `${level * 14 + 8}px` }}
              >
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 shrink-0" />
                ) : (
                  <FolderTree className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">{folder.name}</span>
              </Link>
            </div>

            {isExpanded ? (
              <FolderBranch
                assets={assets}
                basePath={basePath}
                expandedFolders={expandedFolders}
                folders={folders}
                level={level + 1}
                parentFolderId={folder.id}
                selectedAssetId={selectedAssetId}
                selectedFolderId={selectedFolderId}
                setExpandedFolders={setExpandedFolders}
              />
            ) : null}
          </div>
        );
      })}

      {childAssets.map((asset) => (
        <Link
          className={cn(
            "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition",
            selectedAssetId === asset.id
              ? "bg-zinc-950 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
          )}
          href={`${basePath}/${asset.id}`}
          key={asset.id}
          style={{ paddingLeft: `${level * 14 + 35}px` }}
        >
          <KanbanSquare className="h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{asset.name}</p>
            <p className="truncate text-[11px] uppercase tracking-[0.2em] opacity-70">{asset.key}</p>
          </div>
          <span className="rounded-full bg-black/8 px-2 py-1 text-[11px] font-medium dark:bg-white/10">
            {asset.openTaskCount ?? asset.taskCount ?? 0}
          </span>
        </Link>
      ))}
    </>
  );
}

function getExpandedFolderIds(
  folders: FolderNode[],
  assets: AssetNode[],
  selectedFolderId?: string | null,
  selectedAssetId?: string | null,
) {
  const expanded = new Set<string>();
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId);
  const currentFolderId = selectedFolderId ?? selectedAsset?.folderId ?? null;

  let pointer = currentFolderId;

  while (pointer) {
    expanded.add(pointer);
    pointer = folders.find((folder) => folder.id === pointer)?.parentFolderId ?? null;
  }

  return expanded;
}
