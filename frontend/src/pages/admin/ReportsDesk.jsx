import React from 'react';
import { ShieldAlert, Mail, Trash2 } from 'lucide-react';

const ReportsDesk = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-[2rem] border border-dashed border-border">
        <ShieldAlert size={48} className="mx-auto mb-4 opacity-20 text-emerald-500" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Zero Active Reports</p>
        <p className="text-xs text-muted-foreground mt-1">The community is safe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map(report => (
        <div key={report.id} className="bg-card border border-border rounded-[2rem] p-6 shadow-sm space-y-3 animate-in fade-in slide-in-from-bottom-4">
          
          <div className="flex items-center gap-2 text-destructive font-black text-xs uppercase tracking-widest">
            <ShieldAlert size={16} /> {report.category}
          </div>
          
          <p className="text-sm text-foreground font-medium italic bg-secondary/50 p-4 rounded-2xl border border-border">
            "{report.description}"
          </p>
          
          <div className="flex justify-between items-center pt-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Reporter: <span className="font-black text-foreground">{report.reporter_name}</span><br/>
              Target: <span className="font-black text-destructive">{report.reported_user_name}</span>
            </div>
            
            <div className="flex gap-2">
              <button className="p-3 bg-secondary rounded-xl hover:text-primary transition active:scale-95" title="Message User">
                <Mail size={18}/>
              </button>
              <button className="p-3 bg-secondary rounded-xl hover:bg-destructive/10 hover:text-destructive transition active:scale-95" title="Dismiss Report">
                <Trash2 size={18}/>
              </button>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};

export default ReportsDesk;