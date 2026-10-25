import { FormEvent, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function SearchBox() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (query.trim()) params.set('query', query.trim()); else params.delete('query');
    navigate(`/explore?${params}`);
  };
  return <form className="search-box" onSubmit={submit}><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Where do you want to stay?" /><button className="button button-primary">Search</button></form>;
}
