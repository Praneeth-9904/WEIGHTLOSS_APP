export default function About() {
  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow mt-8">
      <h2 className="text-3xl font-bold text-teal-700 mb-4">About the Project</h2>
      <p className="text-gray-700 mb-4 leading-relaxed">
        This application is the production deployment of a Machine Learning Capstone Project. 
        It utilizes a custom-built <strong>Hierarchical Clustering Multilayer Perceptron (HCMLP)</strong> model to predict user adherence to specific diet plans.
      </p>
      
      <h3 className="text-xl font-semibold mt-6 mb-2">Tech Stack</h3>
      <ul className="list-disc pl-6 text-gray-700 space-y-2">
        <li><strong>Machine Learning:</strong> Scikit-Learn, TensorFlow, Keras</li>
        <li><strong>Backend:</strong> FastAPI, Python, Motor (Async MongoDB)</li>
        <li><strong>Frontend:</strong> React.js, Vite, Tailwind CSS</li>
        <li><strong>Database:</strong> MongoDB Atlas</li>
      </ul>

      <div className="mt-8 p-4 bg-teal-50 rounded-lg border border-teal-100">
        <h3 className="font-bold text-teal-800">Project Team</h3>
        <p className="text-teal-700 mt-2">
          Developed by final-year Computer Science engineering students (AI & ML Specialization): P Venkata Sri Nag, T Nikhil Sireesh, Bulusu V S Sri Sai Praneeth, and Sugreevu Aswartha Harshitha. <br/><br/>
          Supervised by Dr. Boddu L V Siva Rama Krishna.
        </p>
      </div>
    </div>
  );
}