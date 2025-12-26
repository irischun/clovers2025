import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, ExternalLink, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePublishingHistory } from '@/hooks/usePublishingHistory';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  published: 'bg-green-500/20 text-green-500',
  failed: 'bg-destructive/20 text-destructive',
  draft: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  published: '已發布',
  failed: '失敗',
  draft: '草稿',
};

const platformIcons: Record<string, typeof Globe> = {
  wordpress: Globe,
};

export function PublishingHistory() {
  const { records, loading, deleteRecord } = usePublishingHistory();
  const [isOpen, setIsOpen] = useState(false);

  const PlatformIcon = platformIcons.wordpress;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                發佈歷史記錄
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {records.length}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {isOpen ? '摺疊' : '展開'}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-3 bg-muted rounded-lg animate-pulse">
                    <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">尚無發佈記錄</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-muted/50 rounded-lg group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <PlatformIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm line-clamp-1">
                          {record.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[record.status]}`}>
                          {statusLabels[record.status] || record.status}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteRecord(record.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {record.content}
                    </p>

                    {record.image_url && (
                      <img
                        src={record.image_url}
                        alt=""
                        className="w-full h-20 object-cover rounded mb-3"
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(record.created_at), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                      </span>
                      {record.published_url && (
                        <a
                          href={record.published_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          查看文章
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
